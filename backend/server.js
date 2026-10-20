require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('./generated/prisma');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { randomUUID } = require('crypto');

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('UniVerse backend is running!');
});

app.get('/api/organizations', async (req, res) => {
    const organizations = await prisma.organization.findMany();
    res.json(organizations);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function requireAuth(requiredRole = null) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;

            if (requiredRole && decoded.role !== requiredRole) {
                return res.status(403).json({ error: 'Not authorized for this action' });
            }

            next();
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    };
}

// Registering a new user
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role: 'student' },
    });

    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// Join an organization
app.post('/api/organizations/:id/join', requireAuth(), async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    await prisma.organization.update({
        where: { id: req.params.id },
        data: { members: { connect: { id: req.user.id } } },
    });

    res.json({ message: `Joined ${org.name}` });
});

// Leave an organization
app.post('/api/organizations/:id/leave', requireAuth(), async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    await prisma.organization.update({
        where: { id: req.params.id },
        data: { members: { disconnect: { id: req.user.id } } },
    });

    res.json({ message: `Left ${org.name}` });
});

// Get the logged-in user's joined organizations
app.get('/api/users/me/organizations', requireAuth(), async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { organizations: true },
    });
    res.json(user.organizations);
});

// List pending organization requests (Admin only)
app.get('/api/admin/requests', requireAuth('admin'), async (req, res) => {
    const requests = await prisma.organizationRequest.findMany();
    res.json(requests);
});

// Approve a request: creates the real organization and removes the request
app.post('/api/admin/requests/:id/approve', requireAuth('admin'), async (req, res) => {
    const request = await prisma.organizationRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // For example, "Anime & Cosplay Society" becomes "anime-cosplay-society"
    const newId = request.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const existing = await prisma.organization.findUnique({ where: { id: newId } });
    if (existing) return res.status(409).json({ error: 'An organization with this name already exists' });

    const newOrg = await prisma.organization.create({
        data: {
            id: newId,
            name: request.name,
            category: request.category,
            description: request.description,
        },
    });

    await prisma.organizationRequest.delete({ where: { id: req.params.id } });

    res.json({ message: `Approved and created ${newOrg.name}`, organization: newOrg });
});

// Reject a request: just removes it
app.post('/api/admin/requests/:id/reject', requireAuth('admin'), async (req, res) => {
    const request = await prisma.organizationRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    await prisma.organizationRequest.delete({ where: { id: req.params.id } });

    res.json({ message: `Rejected request for ${request.name}` });
});

// Admin-only: real counts for the Platform Overview tiles
app.get('/api/admin/stats', requireAuth('admin'), async (req, res) => {
    const organizations = await prisma.organization.count();
    const users = await prisma.user.count();
    const students = await prisma.user.count({ where: { role: 'student' } });
    const pendingRequests = await prisma.organizationRequest.count();
    res.json({ organizations, users, students, pendingRequests });
});

// Remove an existing organization (Admin only)
app.delete('/api/organizations/:id', requireAuth('admin'), async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    await prisma.organization.delete({ where: { id: req.params.id } });

    res.json({ message: `Removed ${org.name}` });
});

// To submit a new organization registration request (for logged-in user)
app.post('/api/requests', requireAuth(), async (req, res) => {
    const { name, category, description } = req.body;
    const submitter = await prisma.user.findUnique({ where: { id: req.user.id } });

    const request = await prisma.organizationRequest.create({
        data: { name, category, description, submittedBy: submitter ? submitter.name : null },
    });
    res.status(201).json(request);
});

// ANNOUNCEMENTS API
// Public users can read announcements. Only officers and admins can create, edit, or delete them.
function requireAnnouncementManager(req, res, next) {
    requireAuth()(req, res, function () {
        if (!['officer', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only officers and admins can manage announcements' });
        }
        next();
    });
}

function normalizeAnnouncementContent(value) {
    if (Array.isArray(value)) {
        return value.map((part) => String(part || '').trim()).filter(Boolean).join('\n\n');
    }
    return String(value || '').trim();
}

function serializeAnnouncement(record) {
    const publishedDate = new Date(record.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    });
    const orgId = record.organizationId || 'universe';
    const orgName = record.organization ? record.organization.name : 'UniVerse';
    return {
        id: record.id,
        title: record.title,
        org: orgId,
        organizationName: orgName,
        organizationLink: record.organization ? (record.organization.link || 'organizations.html') : 'organizations.html',
        authorName: record.author ? record.author.name : orgName,
        postedDate: 'Posted on ' + publishedDate,
        content: String(record.content).split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

async function resolveAnnouncementOrganization(orgKey, res) {
    if (!orgKey || orgKey === 'universe') return null;
    const organization = await prisma.organization.findUnique({ where: { id: orgKey } });
    if (!organization) {
        res.status(400).json({ error: 'Selected organization does not exist' });
        return undefined;
    }
    return organization.id;
}

app.get('/api/announcements', async (req, res) => {
    try {
        const records = await prisma.announcement.findMany({
            include: { organization: true, author: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(records.map(serializeAnnouncement));
    } catch (error) {
        console.error('Could not list announcements:', error);
        res.status(500).json({ error: 'Could not load announcements' });
    }
});

app.get('/api/announcements/:id', async (req, res) => {
    try {
        const record = await prisma.announcement.findUnique({
            where: { id: req.params.id },
            include: { organization: true, author: true },
        });
        if (!record) return res.status(404).json({ error: 'Announcement not found' });
        res.json(serializeAnnouncement(record));
    } catch (error) {
        console.error('Could not get announcement:', error);
        res.status(500).json({ error: 'Could not load announcement' });
    }
});

app.post('/api/announcements', requireAnnouncementManager, async (req, res) => {
    try {
        const body = req.body || {};
        const title = String(body.title || '').trim();
        const content = normalizeAnnouncementContent(body.content);
        const orgKey = String(body.org || 'universe').trim();

        if (!title || !content) {
            return res.status(400).json({ error: 'Announcement title and content are required' });
        }

        const organizationId = await resolveAnnouncementOrganization(orgKey, res);
        if (organizationId === undefined) return;

        const record = await prisma.announcement.create({
            data: { title, content, organizationId, authorId: req.user.id },
            include: { organization: true, author: true },
        });
        res.status(201).json(serializeAnnouncement(record));
    } catch (error) {
        console.error('Could not create announcement:', error);
        res.status(500).json({ error: 'Could not create announcement' });
    }
});

app.put('/api/announcements/:id', requireAnnouncementManager, async (req, res) => {
    try {
        const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Announcement not found' });

        const body = req.body || {};
        const title = String(body.title || '').trim();
        const content = normalizeAnnouncementContent(body.content);
        const orgKey = String(body.org || 'universe').trim();
        if (!title || !content) {
            return res.status(400).json({ error: 'Announcement title and content are required' });
        }

        const organizationId = await resolveAnnouncementOrganization(orgKey, res);
        if (organizationId === undefined) return;

        const record = await prisma.announcement.update({
            where: { id: req.params.id },
            data: { title, content, organizationId },
            include: { organization: true, author: true },
        });
        res.json(serializeAnnouncement(record));
    } catch (error) {
        console.error('Could not update announcement:', error);
        res.status(500).json({ error: 'Could not update announcement' });
    }
});

app.delete('/api/announcements/:id', requireAnnouncementManager, async (req, res) => {
    try {
        const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Announcement not found' });

        await prisma.announcement.delete({ where: { id: req.params.id } });
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        console.error('Could not delete announcement:', error);
        res.status(500).json({ error: 'Could not delete announcement' });
    }
});


//fetch categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});


//fetch events for events.html
app.get('/api/events', async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            include: {
                categories: true,
                galleryPhotos: true,
                orgsRelated: true,
                schedules: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// fetch a specific event's details for event-details.html
app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                categories: true,
                schedules: true,
                galleryPhotos: true,
                orgsRelated: true
            }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).json({ error: 'Could not reach the server' });
    }
});

// EVENTS: permission helpers
// Only officers and admins can create, edit, or delete events
function requireEventManager(req, res, next) {
    requireAuth()(req, res, function () {
        if (!['officer', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only officers and admins can manage events' });
        }
        next();
    });
}

// IDs of the organizations the given user belongs to
async function getUserOrgIds(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organizations: true },
    });
    return user ? user.organizations.map((org) => org.id) : [];
}

// for updating an event
app.put('/api/events/:id', requireEventManager, async (req, res) => {
    try {
                const eventId = req.params.id;

        // Officers can only edit events that involve their own org.
        // They also can't remove their own org. from the event
        if (req.user.role === 'officer') {
            const existing = await prisma.event.findUnique({
                where: { id: eventId },
                include: { orgsRelated: true }
            });
            if (!existing) return res.status(404).json({ error: 'Event not found' });

            const myOrgIds = await getUserOrgIds(req.user.id);
            const myOrgsOnEvent = existing.orgsRelated
                .map((org) => org.id)
                .filter((id) => myOrgIds.includes(id));
            const newOrgIds = req.body.orgs || [];

            if (myOrgsOnEvent.length === 0) {
                return res.status(403).json({ error: 'You can only edit events involving your organization' });
            }
            if (!myOrgsOnEvent.every((id) => newOrgIds.includes(id))) {
                return res.status(403).json({ error: 'You cannot remove your own organization from an event' });
            }
        }
        const { name, description, status, location, startDate, endDate, eventPhotoUrl, orgs, categories, schedules, galleryPhotos } = req.body;

        const updatedEvent = await prisma.$transaction(async (tx) => {
            
            const existingSchedules = await tx.eventSchedule.findMany({ where: { eventId }, select: { id: true } });
            const incomingScheduleIds = (schedules || []).filter(s => s.id).map(s => s.id);
            const schedulesToDelete = existingSchedules.filter(es => !incomingScheduleIds.includes(es.id)).map(es => es.id);

            if (schedulesToDelete.length > 0) {
                await tx.eventSchedule.deleteMany({ where: { id: { in: schedulesToDelete } } });
            }

            for (const s of (schedules || [])) {
                const scheduleDatePart = s.date ? s.date.split('T')[0] : new Date().toISOString().split('T')[0];
                const startTimeISO = s.startTime ? new Date(`${scheduleDatePart}T${s.startTime}:00.000Z`) : null;
                const endTimeISO = s.endTime ? new Date(`${scheduleDatePart}T${s.endTime}:00.000Z`) : null;

                if (s.id) {
                    await tx.eventSchedule.update({
                        where: { id: s.id },
                        data: {
                            title: s.title,
                            date: s.date ? new Date(s.date) : new Date(),
                            startTime: startTimeISO,
                            endTime: endTimeISO,
                            location: s.location,
                            description: s.description
                        }
                    });
                } else {
                    await tx.eventSchedule.create({
                        data: {
                            eventId,
                            title: s.title || '',
                            date: s.date ? new Date(s.date) : new Date(),
                            startTime: startTimeISO,
                            endTime: endTimeISO,
                            location: s.location || '',
                            description: s.description || ''
                        }
                    });
                }
            }

            const existingPhotos = await tx.eventPhoto.findMany({ where: { eventId }, select: { id: true } });
            const incomingPhotoIds = (galleryPhotos || []).filter(p => p.id).map(p => p.id);
            const photosToDelete = existingPhotos.filter(ep => !incomingPhotoIds.includes(ep.id)).map(ep => ep.id);

            if (photosToDelete.length > 0) {
                await tx.eventPhoto.deleteMany({ where: { id: { in: photosToDelete } } });
            }

            for (const p of (galleryPhotos || [])) {
                if (!p.photoUrl || p.photoUrl.trim() === '') continue;

                if (p.id) {
                    await tx.eventPhoto.update({
                        where: { id: p.id },
                        data: {
                            photoUrl: p.photoUrl.trim(),
                            caption: p.caption ? p.caption.trim() : ''
                        }
                    });
                } else {
                    await tx.eventPhoto.create({
                        data: {
                            eventId,
                            photoUrl: p.photoUrl.trim(),
                            caption: p.caption ? p.caption.trim() : ''
                        }
                    });
                }
            }

            return await tx.event.update({
                where: { id: eventId },
                data: {
                    name,
                    description,
                    status,
                    location,
                    eventPhotoUrl,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    orgsRelated: { set: (orgs || []).map(id => ({ id })) },
                    categories: { set: (categories || []).map(id => ({ id })) }
                },
                include: {
                    orgsRelated: true,
                    categories: true,
                    schedules: true,
                    galleryPhotos: true
                }
            });
        });

        res.json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

//for creating new event
app.post('/api/events', requireEventManager, async (req, res) => {
    try {
        const { name, description, status, location, startDate, endDate, eventPhotoUrl, orgs, categories, schedules, galleryPhotos } = req.body;
        
            if (!name || !Array.isArray(orgs) || orgs.length === 0) {
                return res.status(400).json({ error: 'Event name and at least one organization are required' });
        }

        // Officers must be in an organization, and that organization must be selected
        if (req.user.role === 'officer') {
            const myOrgIds = await getUserOrgIds(req.user.id);
            if (myOrgIds.length === 0) {
                return res.status(403).json({ error: 'Join an organization before posting events' });
            }
            if (!myOrgIds.every((id) => orgs.includes(id))) {
                return res.status(403).json({ error: 'Your organization must be selected for this event' });
            }
        }

        const newEventId = randomUUID();

        const newEvent = await prisma.$transaction(async (tx) => {
            return await tx.event.create({
                data: {
                    id: newEventId,
                    name,
                    description: description || '',
                    status: status || 'Upcoming',
                    location: location || '',
                    eventPhotoUrl: eventPhotoUrl || '',
                    startDate: startDate ? new Date(`${startDate.slice(0, 10)}T00:00:00.000Z`) : new Date(),
                    endDate: endDate ? new Date(`${endDate.slice(0, 10)}T00:00:00.000Z`) : new Date(),
                    createdById: req.user.id,
                    orgsRelated: {
                        connect: (orgs || []).map(id => ({ id }))
                    },
                    categories: {
                        connect: (categories || []).map(id => ({ id }))
                    },
                    schedules: {
                        create: (schedules || []).map(s => {
                            const schedDatePart = s.date ? s.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
                            return {
                                title: s.title || '',
                                date: new Date(`${schedDatePart}T00:00:00.000Z`),
                                startTime: s.startTime ? new Date(`${schedDatePart}T${s.startTime}:00.000Z`) : null,
                                endTime: s.endTime ? new Date(`${schedDatePart}T${s.endTime}:00.000Z`) : null,
                                location: s.location || '',
                                description: s.description || ''
                            };
                        })
                    },
                    galleryPhotos: {
                        create: (galleryPhotos || []).filter(p => p.photoUrl && p.photoUrl.trim() !== '').map(p => ({
                            photoUrl: p.photoUrl.trim(),
                            caption: p.caption ? p.caption.trim() : ''
                        }))
                    }
                },
                include: {
                    orgsRelated: true,
                    categories: true,
                    schedules: true,
                    galleryPhotos: true
                }
            });
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

//for deleting events
app.delete('/api/events/:id', requireEventManager, async (req, res) => {
    try {
        const { id } = req.params;
        const existingEvent = await prisma.event.findUnique({
            where: { id },
            include: { orgsRelated: true }
        });

        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Officers can only delete events involving their own organization
        if (req.user.role === 'officer') {
            const myOrgIds = await getUserOrgIds(req.user.id);
            const involvesMyOrg = existingEvent.orgsRelated.some((org) => myOrgIds.includes(org.id));
            if (!involvesMyOrg) {
                return res.status(403).json({ error: 'You can only delete events involving your organization' });
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.eventSchedule.deleteMany({ where: { eventId: id } });
            await tx.eventPhoto.deleteMany({ where: { eventId: id } });
            await tx.event.delete({
                where: { id }
            });
        });

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event: ' + error.message });
    }
});
require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('./generated/prisma');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

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
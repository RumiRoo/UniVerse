require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const bcrypt = require('bcryptjs');

async function main() {
    const organizations = [
        {
            id: 'digital-fort',
            name: 'The Digital Fort',
            category: 'journalism',
            description: 'The official journalism club of MMDC...',
            photo: 'assets/the-digital-fort.jpeg',
            link: 'digital-fort.html',
        },
        {
            id: 'disenyo-malaya',
            name: 'Disenyo Malaya',
            category: 'arts',
            description: 'An organization dedicated to aspiring designers...',
            photo: 'assets/disenyo-malaya.jpg',
            link: 'disenyo-malaya.html',
        },
        {
            id: 'scholars-club',
            name: 'Scholars Club',
            category: 'academic',
            description: 'A place for MMDC scholars to connect...',
            photo: 'assets/scholars-club.jpg',
            link: 'scholars-club.html',
        },
    ];

    for (const org of organizations) {
        await prisma.organization.upsert({
            where: { id: org.id },
            update: org,
            create: org,
        });
    }

        // Demo accounts for testing
    const demoUsers = [
        { email: 'student@mmdc.edu', password: 'student123', name: 'Demo Student', role: 'student' },
        { email: 'officer@mmdc.edu', password: 'officer123', name: 'Demo Officer', role: 'officer' },
        { email: 'admin@mmdc.edu', password: 'admin123', name: 'Demo Admin', role: 'admin' },
    ];

    for (const user of demoUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.upsert({
            where: { email: user.email },
            update: { password: hashedPassword, name: user.name, role: user.role },
            create: { email: user.email, password: hashedPassword, name: user.name, role: user.role },
        });
    }

        // Demo organization registration requests (for the Admin panel)
    const demoRequests = [
        {
            id: 'req-1',
            name: 'Anime & Cosplay Society',
            category: 'arts',
            description: 'A community for anime fans and cosplayers to share crafts, host meetups, and join conventions together.',
            submittedBy: 'Karlo Dizon',
        },
        {
            id: 'req-2',
            name: 'Basketball Varsity Club',
            category: 'sports',
            description: 'The official basketball club for MMDC students: open practices, intramurals, and inter-school games.',
            submittedBy: 'Miguel Torres',
        },
    ];

    for (const request of demoRequests) {
        await prisma.organizationRequest.upsert({
            where: { id: request.id },
            update: request,
            create: request,
        });
    }

    // Demo announcements (create them only when they do not already exist,
    // so running setup again does not overwrite announcements that were edited).
    const demoAnnouncements = [
        {
            id: 'org-registrations',
            title: 'Organization Registrations Are Now Open!',
            organizationId: null,
            content: [
                'Students may now browse and join registered organizations through UniVerse!',
                'Explore the available student organizations, learn more about their activities and events, and discover opportunities to get involved in the university community.',
                'Whether you are interested in journalism, arts and design, academics, or other student activities, UniVerse makes it easier to discover organizations that match your interests.'
            ].join('\n\n'),
            createdAt: new Date('2026-09-06T08:00:00.000Z')
        },
        {
            id: 'news-writing-workshop',
            title: 'News Writing Workshop',
            organizationId: 'digital-fort',
            content: [
                'The Digital Fort will be holding a writing workshop for students interested in journalism, and content and news writing.',
                'The session will cover the basics of campus reporting, interviewing techniques, and editorial writing. All beginners are welcome.',
                'Slots are limited so register early to secure a spot!'
            ].join('\n\n'),
            createdAt: new Date('2026-09-12T08:00:00.000Z')
        },
        {
            id: 'design-exhibition',
            title: 'Design Exhibition Submissions Are Open!',
            organizationId: 'disenyo-malaya',
            content: [
                'Calling all creatives! Students may submit their artwork for a chance to showcase it on the upcoming campus design exhibition on September 18, Friday.',
                'The theme is "Digital Consumption". Interpret and present it however you like, whether through illustration, UI/UX mockups, or mixed media.',
                'Submissions are open to all students, regardless of course or year level.'
            ].join('\n\n'),
            createdAt: new Date('2026-09-07T08:00:00.000Z')
        },
        {
            id: 'leadership-workshop',
            title: 'Leadership Workshop Registration',
            organizationId: 'scholars-club',
            content: [
                'Registration is now open on Scholars Club\'s webpage for the upcoming leadership development workshop.',
                'The workshop covers essential skills for scholars taking on peer mentor and leadership roles across the university.',
                'Do take note that seats are limited to keep the session hands-on and interactive.'
            ].join('\n\n'),
            createdAt: new Date('2026-09-06T07:00:00.000Z')
        }
    ];

    for (const announcement of demoAnnouncements) {
        await prisma.announcement.upsert({
            where: { id: announcement.id },
            update: {},
            create: announcement,
        });
    }

    console.log('Seed complete!');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
    
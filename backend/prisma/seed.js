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

    console.log('Seed complete!');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
    
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
        { email: 'officer@mmdc.edu', password: 'officer123', name: 'Demo Officer', role: 'officer' ,
            organizations: {
                connect: [
                    { id: 'digital-fort' }
                ]
            }
        },
        { email: 'admin@mmdc.edu', password: 'admin123', name: 'Demo Admin', role: 'admin'}
    ];

    for (const user of demoUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.upsert({
            where: { email: user.email },
            update: { password: hashedPassword, name: user.name, role: user.role,organizations: user.organizations},
            create: { email: user.email, password: hashedPassword, name: user.name, role: user.role,organizations: user.organizations },
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


    const demoCategories = [
        { id: 'academic', text: 'Academic' },
        { id: 'arts', text: 'Arts & Design' },
        { id: 'journalism', text: 'Journalism' },
        { id: 'sports', text: 'Sports' },
        { id: 'technology', text: 'Technology' },
    ];

    for (const category of demoCategories) {
        await prisma.category.upsert({
            where: { id: category.id },
            update: category,
            create: category,
        });
    }

    const demoEvents = [
        {
            id: '7vMGLwfss-scuLloOcd',
            name: 'Digital Consumption Art Exhibition',
            description: "Ready to be immersed? The digital consumption art exhibition invites everyone with passion for visual media to view our talented students’ pieces!",
            status: 'Upcoming',
            startDate: new Date('2026-12-05T00:00:00.000Z'),
            endDate: new Date('2026-12-05T00:00:00.000Z'),
            eventPhotoUrl: 'assets/art-exhibit.jpg',
            location: "Mapua Malayan Colleges Laguna",
            
            categories: {
                connect: [
                    { id: 'arts' },
                ]
            },
            orgsRelated: {
                connect: [
                    { id: 'disenyo-malaya' }
                ]
            },
            schedules: {
                create: [
                    {
                        title: 'Grand Opening & Main Booth Fair',
                        date: new Date('2026-12-05T00:00:00.000Z'),
                        startTime: new Date('2026-12-05T09:00:00.000Z'),
                        endTime: new Date('2026-12-05T10:00:00.000Z'),
                        location: 'ETY Building Lobby',
                        description: 'Perceive awesome art!'
                    }
                ]
            },
            galleryPhotos: {
                create: [
                    { photoUrl: 'assets/art-exhibit.jpg', caption: 'Exhibit Setup' }
                ]
            }
        },

        {
            id: 'gJNvoByztucQP92_mqN',
            name: 'Student Organizations Fair',
            description: "A collaboration between all of MMDC's organizations, this special event brings together the talents of all student groups. Join now to showcase your talents!",
            status: 'Ongoing',
            startDate: new Date('2026-11-26T00:00:00.000Z'),
            endDate: new Date('2026-11-30T00:00:00.000Z'),
            eventPhotoUrl: 'assets/student-fair.jpg',
            location: "Mapua Malayan Digital College Luzon Hub",
            
            categories: {
                connect: [
                    { id: 'arts' },
                    { id: 'journalism' },
                    { id: 'academic' }
                ]
            },
            orgsRelated: {
                connect: [
                    { id: 'disenyo-malaya' },
                    { id: 'digital-fort' },
                    { id: 'scholars-club' }
                ]
            },
            schedules: {
                create: [
                    {
                        title: 'Grand Opening & Main Booth Fair',
                        date: new Date('2026-11-26T00:00:00.000Z'),
                        startTime: new Date('2026-11-26T09:00:00.000Z'),
                        endTime: new Date('2026-11-26T10:00:00.000Z'),
                        location: 'Main Quad',
                        description: 'Kickoff ceremony, welcome address, and opening of all general booth exhibits.'
                    },
                    {
                        title: '"Behind the Headlines" Live Pitch & Workshop',
                        date: new Date('2026-11-30T00:00:00.000Z'),
                        startTime: new Date('2026-11-30T10:30:00.000Z'),
                        endTime: new Date('2026-11-30T12:30:00.000Z'),
                        location: 'Student Center 201',
                        description: 'Interactive session on campus reporting, photojournalism basics, and pitch ideas.'
                    },
                    {
                        title: 'Academic Bowl & Quiz Bee',
                        date: new Date('2026-11-30T00:00:00.000Z'),
                        startTime: new Date('2026-11-30T13:30:00.000Z'),
                        endTime: new Date('2026-11-30T14:45:00.000Z'),
                        location: 'Auditorium',
                        description: 'Inter-departmental trivia challenge showcasing top academic talent across subjects.'
                    },
                    {
                        title: 'Live Canvas & Interactive Mural Jam',
                        date: new Date('2026-11-30T00:00:00.000Z'),
                        startTime: new Date('2026-11-30T15:00:00.000Z'),
                        endTime: new Date('2026-11-30T17:30:00.000Z'),
                        location: 'Main Courtyard',
                        description: 'Watch live painting demonstrations or mark your trace on the interactive campus mural.'
                    }
                ]
            },
            galleryPhotos: {
                create: [
                    { photoUrl: 'assets/student-fair.jpg', caption: 'Students at the workshop' },
                    { photoUrl: 'assets/quizbee.jfif', caption: 'Quizbee setup at the auditorium' }
                ]
            }
        },

        {
            id: 'ypy5DWATAa17D10HFh3',
            name: 'Introduction to Web Systems & Technology',
            description: "Explore the core protocols and architecture powering modern online platforms in this engaging introductory session. Aspiring developers will gain essential insights into how network systems seamlessly connect users worldwide.",
            status: 'Upcoming',
            startDate: new Date('2026-12-05T00:00:00.000Z'),
            endDate: new Date('2026-12-05T00:00:00.000Z'),
            eventPhotoUrl: 'assets/web-system.jpg',
            location: "Mapua Malayan Colleges Laguna",
            
            categories: {
                connect: [
                    { id: 'academic' }
                ]
            },
            orgsRelated: {
                connect: [
                    { id: 'digital-fort' }
                ]
            },
            schedules: {
                create: [
                    {
                        title: 'Web Systems & Technology Seminar',
                        date: new Date('2026-12-05T00:00:00.000Z'),
                        startTime: new Date('2026-12-05T09:00:00.000Z'),
                        endTime: new Date('2026-12-05T10:00:00.000Z'),
                        location: 'Auditorium',
                        description: 'A seminar learn core principles of IT.'
                    }
                ]
            },
            galleryPhotos: {
                create: [
                    { photoUrl: 'assets/quizbee.jfif', caption: 'Seminar setup at the auditorium' }
                ]
            }
        }
    ];

    for (const event of demoEvents) {
        await prisma.event.upsert({
            where: { id: event.id },
            update: {},
            create: event,
        });
    }

    console.log('Seed complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
    
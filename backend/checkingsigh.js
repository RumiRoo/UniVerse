const { PrismaClient } = require('./generated/prisma');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
require('dotenv').config();

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const events = await prisma.event.findMany({
        select: { 
            id: true, 
            name: true, 
            eventPhotoUrl: true,
            location: true,
            schedules: true,
            galleryPhotos: true,
            orgsRelated: true,
            createdAt:true,
            startDate: true,
            endDate: true
        }
    });
    console.log("Database Events Check:", events);

    const users = await prisma.user.findMany({
        include: {
            organizations: true
        }
    });
    users.forEach(user => {
        console.log(`User: ${user.name} (${user.email}) [Role: ${user.role}]`);
        console.log(`Joined Orgs:`, user.organizations.map(o => ({ id: o.id, name: o.name })));
    });

    const organizations = await prisma.organization.findMany({
        include: {
            members: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });
    organizations.forEach(org => {
        console.log(`Organization: ${org.name} (${org.id})`);
        console.log(`Members Count: ${org.members.length}`);
        console.log(`Members List:`, org.members.map(m => `${m.name} (${m.email}) [${m.role}]`));
    });

    const eventPhotos = await prisma.eventPhoto.findMany();
    eventPhotos.forEach(photo => {
        console.log(`Event Photo ID: ${photo.id} -> URL: ${photo.photoUrl} (${photo.caption})`);
    });

    const eventSchedules = await prisma.eventSchedule.findMany();
    eventSchedules.forEach(sched => {
        console.log(`${sched.title} | ${sched.startTime} | ${sched.endTime} | ${sched.date}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
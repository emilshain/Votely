const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'voting.db');
const db = new sqlite3.Database(dbPath);

const candidates = [
    {
        id: 1,
        name: 'Emil Shain',
        description: 'Emil Shain is a B.Tech CSE student at Christ College of Engineering, Irinjalakuda. A passionate Frontend Developer and skilled graphic designer, he creates beautiful, responsive user interfaces that perfectly blend technology and design.',
        image_url: 'https://media.licdn.com/dms/image/v2/D5603AQFRTPz3RI0XYw/profile-displayphoto-scale_400_400/B56ZtyR3X7KcAg-/0/1767148847049?e=1770854400&v=beta&t=5csMgspvit-VG7zVZ7hCy47z5A2xXHqIbtkKfYSdKjM'
    },
    {
        id: 2,
        name: 'Chris Maria Shajan C',
        description: 'Chris Maria Shajan C is a focused and dedicated second-year B.Tech CSE student at Christ College of Engineering, Thrissur. She is passionate about growing through consistent learning, with active interests in Data Analytics, AI-driven automation, and engineering innovations.',
        image_url: 'https://media.licdn.com/dms/image/v2/D5603AQEqmqwPjPu1_A/profile-displayphoto-shrink_400_400/B56ZUfEMjDGoAg-/0/1739982949649?e=1770854400&v=beta&t=tx6VfZ_MYP5MwhUcGEuwkr5dmHKguxhxLGAblk6Kff4'
    }
];

db.serialize(() => {
    const stmt = db.prepare("UPDATE candidates SET name = ?, description = ?, image_url = ? WHERE id = ?");

    candidates.forEach(c => {
        stmt.run(c.name, c.description, c.image_url, c.id, function (err) {
            if (err) console.error(`Error updating candidate ${c.id}:`, err);
            else console.log(`Candidate ${c.id} updated. Rows changed: ${this.changes}`);
        });
    });

    stmt.finalize();
});

db.close();

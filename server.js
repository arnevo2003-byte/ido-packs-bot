const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const ADMIN_PASSWORD = "my-secret-admin-password";

// הגדלת מגבלת הנפח ל-10 מגה-בייט למניעת שגיאות PayloadTooLargeError בתמונות
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

if (!fs.existsSync('public/uploads')) {
    fs.mkdirSync('public/uploads', { recursive: true });
}
app.use(express.static('public'));

const saveBase64Image = (base64Str) => {
    if (!base64Str || !base64Str.startsWith('data:image')) return null;
    try {
        const matches = base64Str.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;
        const ext = matches[1].split('+')[0];
        const buf = Buffer.from(matches[2], 'base64');
        const filename = 'upload_' + Date.now() + '.' + (ext === 'jpeg' ? 'jpg' : ext);
        fs.writeFileSync(path.join(__dirname, 'public/uploads', filename), buf);
        return '/uploads/' + filename;
    } catch (e) {
        return null;
    }
};

const getBots = () => {
    if (!fs.existsSync('bots.json')) return [];
    try {
        return JSON.parse(fs.readFileSync('bots.json', 'utf8'));
    } catch (err) {
        return [];
    }
};

const saveBots = (bots) => {
    fs.writeFileSync('bots.json', JSON.stringify(bots, null, 2));
};

const getUsers = () => {
    if (!fs.existsSync('users.json')) return [];
    try {
        return JSON.parse(fs.readFileSync('users.json', 'utf8'));
    } catch (err) {
        return [];
    }
};

const saveUsers = (users) => {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
};

const getUserBots = () => {
    if (!fs.existsSync('user_bots.json')) return [];
    try {
        return JSON.parse(fs.readFileSync('user_bots.json', 'utf8'));
    } catch (err) {
        return [];
    }
};

const saveUserBots = (userBots) => {
    fs.writeFileSync('user_bots.json', JSON.stringify(userBots, null, 2));
};

const getCookie = (req, name) => {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
};

// עמוד ראשי - ספריית הבוטים
app.get('/', (req, res) => {
    const bots = getBots();
    const username = getCookie(req, 'username');
    const selectedCategory = req.query.category || 'הכל';
    const categoriesList = ['הכל', 'הבוטים שלי (My Bots)', 'ניהול (Moderation)', 'מוזיקה (Music)', 'כרטיסים (Tickets)', 'קהילה (Community)', 'אחר (Other)'];

    const filteredBots = selectedCategory === 'הכל' 
        ? bots 
        : bots.filter(b => (b.category || 'אחר') === selectedCategory);

    let botsHtml = filteredBots.length === 0 ? '<p style="color: #888; margin-top: 20px;">אין בוטים בקטגוריה זו כרגע.</p>' : `
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px; justify-content: center;">
            ${filteredBots.map(b => `
                <div style="background: #202225; padding: 15px; border-radius: 6px; border: 1px solid #444; width: 240px; box-sizing: border-box; text-align: right;">
                    <strong style="font-size: 16px; color: #fff;">🤖 ${b.name || 'בוט'}</strong><br>
                    <span style="font-size: 12px; background: #5865F2; padding: 2px 6px; border-radius: 4px; display: inline-block; margin: 5px 0;">${b.category || 'אחר'}</span>
                    <p style="font-size: 13px; color: #ccc; margin: 8px 0; min-height: 30px;">${b.description || 'אין תיאור זמין.'}</p>
                    <a href="/add-bot/${encodeURIComponent(b.clientId || '')}" style="display: block; background: #43b581; color: white; text-align: center; padding: 6px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: bold; margin-top: 10px;">אוסף לשרת</a>
                </div>
            `).join('')}
        </div>
    `;

    let navHtml = categoriesList.map(cat => `
        <a href="/?category=${encodeURIComponent(cat)}" style="background: ${selectedCategory === cat ? '#5865F2' : '#2f3136'}; color: white; padding: 8px 14px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold; border: 1px solid #444;">${cat}</a>
    `).join('');

    let authLinks = username ? `
        <span style="color: #43b581; font-weight: bold; margin-left: 15px;">שלום, ${username}</span>
        <a href="/user-bots" class="link-btn" style="background: #5865F2;">🤖 הבוטים שלי</a>
        <a href="/logout" class="link-btn" style="background: #ed4245;">התנתק</a>
    ` : `
        <a href="/login" class="link-btn" style="background: #5865F2;">התחברות</a>
        <a href="/register" class="link-btn" style="background: #43b581;">הרשמה</a>
    `;

    res.send(`
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>ספריית הבוטים</title>
            <style>
                body { font-family: Arial, sans-serif; background: #1e1e1e; color: #fff; text-align: center; padding: 30px; }
                .container { max-width: 950px; margin: 0 auto; background: #36393f; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
                .nav-links { margin-bottom: 20px; display: flex; justify-content: center; gap: 10px; align-items: center; }
                .link-btn { color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; }
                .categories-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 25px; border-bottom: 1px solid #444; padding-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="nav-links">
                    <a href="/admin-panel" class="link-btn" style="background: #7289da;">🔒 פאנל ניהול</a>
                    ${authLinks}
                </div>
                <h1>ספריית הבוטים</h1>
                <p style="color: #bbb; margin-bottom: 20px;">בחר קטגוריה למעלה או הוסף את הבוט לשרת שלך</p>
                <div class="categories-bar">${navHtml}</div>
                ${botsHtml}
            </div>
        </body>
        </html>
    `);
});

// הרשמה
app.get('/register', (req, res) => {
    res.send(`
        <html lang="he" dir="rtl">
        <head><meta charset="UTF-8"><title>הרשמה</title>
        <style>body{background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:50px;}</style></head>
        <body>
            <div style="background:#2f3136;max-width:400px;margin:auto;padding:30px;border-radius:8px; text-align: right;">
                <h2 style="text-align:center; color:#fff;">יצירת חשבון חדש</h2>
                <form method="POST" action="/register">
                    <label style="font-size:13px; color:#ccc;">שם משתמש:</label>
                    <input type="text" name="username" placeholder="בחר שם משתמש" required style="padding:8px;width:100%;margin:5px 0 15px 0;background:#202225;color:#fff;border:1px solid #444;border-radius:4px;box-sizing:border-box;">
                    
                    <label style="font-size:13px; color:#ccc;">סיסמה:</label>
                    <input type="password" name="password" placeholder="בחר סיסמה" required style="padding:8px;width:100%;margin:5px 0 15px 0;background:#202225;color:#fff;border:1px solid #444;border-radius:4px;box-sizing:border-box;">
                    
                    <button type="submit" style="background:#43b581;color:#fff;border:none;padding:10px;width:100%;border-radius:4px;cursor:pointer;font-weight:bold;">הירשם</button>
                </form>
                <p style="text-align:center; margin-top:15px; font-size:13px;"><a href="/login" style="color:#7289da;">יש לך כבר חשבון? התחבר כאן</a></p>
            </div>
        </body>
        </html>
    `);
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    if (users.find(u => u.username === username)) {
        return res.send('<script>alert("שם המשתמש כבר תפוס!"); window.location.href="/register";</script>');
    }

    users.push({ username, password });
    saveUsers(users);

    res.setHeader('Set-Cookie', `username=${encodeURIComponent(username)}; Path=/; HttpOnly`);
    res.redirect('/');
});

// התחברות
app.get('/login', (req, res) => {
    res.send(`
        <html lang="he" dir="rtl">
        <head><meta charset="UTF-8"><title>התחברות</title>
        <style>body{background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:50px;}</style></head>
        <body>
            <div style="background:#2f3136;max-width:400px;margin:auto;padding:30px;border-radius:8px; text-align: right;">
                <h2 style="text-align:center; color:#fff;">התחברות למערכת</h2>
                <form method="POST" action="/login">
                    <label style="font-size:13px; color:#ccc;">שם משתמש:</label>
                    <input type="text" name="username" placeholder="שם משתמש" required style="padding:8px;width:100%;margin:5px 0 15px 0;background:#202225;color:#fff;border:1px solid #444;border-radius:4px;box-sizing:border-box;">
                    
                    <label style="font-size:13px; color:#ccc;">סיסמה:</label>
                    <input type="password" name="password" placeholder="סיסמה" required style="padding:8px;width:100%;margin:5px 0 15px 0;background:#202225;color:#fff;border:1px solid #444;border-radius:4px;box-sizing:border-box;">
                    
                    <button type="submit" style="background:#5865F2;color:#fff;border:none;padding:10px;width:100%;border-radius:4px;cursor:pointer;font-weight:bold;">התחבר</button>
                </form>
                <p style="text-align:center; margin-top:15px; font-size:13px;"><a href="/register" style="color:#43b581;">אין לך חשבון? הירשם כאן</a></p>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.send('<script>alert("שם משתמש או סיסמה שגויים!"); window.location.href="/login";</script>');
    }

    res.setHeader('Set-Cookie', `username=${encodeURIComponent(username)}; Path=/; HttpOnly`);
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    res.redirect('/');
});

// עמוד הוספת בוט לשרת
app.get('/add-bot/:clientId', (req, res) => {
    const clientId = req.params.clientId || '';
    const username = getCookie(req, 'username');

    if (!username) {
        return res.send('<script>alert("עליך להתחבר לאתר כדי להוסיף בוט!"); window.location.href="/login";</script>');
    }

    res.send(`
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>הוספת בוט לשרת</title>
            <style>
                body { font-family: Arial, sans-serif; background: #1e1e1e; color: #fff; text-align: center; padding: 50px; }
                .box { background: #2f3136; max-width: 450px; margin: auto; padding: 30px; border-radius: 8px; text-align: right; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
                input { padding: 8px; width: 100%; margin: 8px 0 15px 0; background: #202225; border: 1px solid #444; color: white; border-radius: 4px; box-sizing: border-box; }
                button { background: #43b581; color: white; border: none; padding: 10px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 15px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2 style="text-align: center; color: #fff;">הוספת בוט לשרת שלך</h2>
                <form action="/save-user-bot" method="POST">
                    <input type="hidden" name="clientId" value="${clientId}">
                    <input type="hidden" name="serverImage" id="serverImageInput">

                    <label style="font-size: 13px; color: #ccc;">שם השרת שלך:</label>
                    <input type="text" name="serverName" placeholder="הכנס את שם השרת שלך" required>

                    <label style="font-size: 13px; color: #ccc;">מזהה שרת הדיסקורד שלך (Guild ID):</label>
                    <input type="text" name="guildId" placeholder="הכנס את איידי השרת שלך" required>

                    <label style="font-size: 13px; color: #ccc;">תמונת השרת:</label>
                    <input type="file" id="imageFile" accept="image/*" style="background: none; border: none; padding: 0;" onchange="convertImage(this)">

                    <button type="submit">המשך להוספת הבוט לשרת</button>
                </form>
            </div>
            <script>
                function convertImage(input) {
                    const file = input.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            document.getElementById('serverImageInput').value = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// שמירת הבוט ברשימת המשתמש ומעבר לדיסקורד
app.post('/save-user-bot', (req, res) => {
    const username = getCookie(req, 'username');
    if (!username) return res.redirect('/login');

    const { clientId, guildId, serverName, serverImage } = req.body;
    let bots = getBots();
    const targetBot = bots.find(b => b.clientId === clientId);

    let imagePath = saveBase64Image(serverImage);

    if (targetBot) {
        let userBots = getUserBots();
        userBots.push({
            id: Date.now().toString(),
            username: username,
            name: targetBot.name,
            category: targetBot.category,
            description: targetBot.description,
            clientId: targetBot.clientId,
            guildId: guildId ? guildId.trim() : '',
            serverName: serverName ? serverName.trim() : 'שרת ללא שם',
            serverImage: imagePath || ''
        });
        saveUserBots(userBots);
    }

    let discordUrl = 'https://discord.com/oauth2/authorize?client_id=' + encodeURIComponent(clientId) + '&scope=bot&permissions=8';
    if(guildId) {
        discordUrl += '&guild_id=' + encodeURIComponent(guildId.trim());
    }
    res.redirect(discordUrl);
});

// פאנל הבוטים שלי (כולל אפשרות לערוך את פרטי השרת / Guild ID)
app.get('/user-bots', (req, res) => {
    const username = getCookie(req, 'username');
    if (!username) {
        return res.redirect('/login');
    }

    const userBots = getUserBots();
    const myBots = userBots.filter(b => b.username === username);

    let resultsHtml = myBots.length === 0 ? '<p style="color: #ed4245; margin-top: 20px;">עוד לא הוספת בוטים לשרתים שלך דרך האתר.</p>' : `
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px; justify-content: center;">
            ${myBots.map(b => `
                <div style="background: #202225; padding: 15px; border-radius: 6px; border: 1px solid #444; width: 280px; box-sizing: border-box; text-align: right;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        ${b.serverImage ? `<img src="${b.serverImage}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : '<div style="width: 40px; height: 40px; border-radius: 50%; background: #5865F2; display: flex; align-items: center; justify-content: center; font-weight: bold;">🏠</div>'}
                        <div>
                            <strong style="font-size: 15px; color: #fff; display: block;">${b.serverName || 'שרת ללא שם'}</strong>
                            <span style="font-size: 11px; color: #aaa;">איידי שרת: ${b.guildId || '-'}</span>
                        </div>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #444; margin: 8px 0;">
                    <strong style="font-size: 14px; color: #43b581;">🤖 ${b.name || 'בוט'}</strong><br>
                    <span style="font-size: 11px; background: #5865F2; padding: 2px 6px; border-radius: 4px; display: inline-block; margin: 4px 0;">${b.category || 'אחר'}</span>
                    <p style="font-size: 12px; color: #ccc; margin: 6px 0;">${b.description || 'אין תיאור זמין.'}</p>
                    
                    <!-- טופס עריכת פרטי השרת / ID -->
                    <form action="/edit-user-bot/${b.id}" method="POST" style="margin-top: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">
                        <label style="font-size: 11px; color: #bbb;">ערוך שם שרת:</label>
                        <input type="text" name="serverName" value="${b.serverName || ''}" style="padding: 5px; width: 100%; margin: 2px 0 6px 0; background: #202225; border: 1px solid #444; color: white; border-radius: 3px; font-size: 12px; box-sizing: border-box;">
                        
                        <label style="font-size: 11px; color: #bbb;">ערוך Guild ID:</label>
                        <input type="text" name="guildId" value="${b.guildId || ''}" style="padding: 5px; width: 100%; margin: 2px 0 6px 0; background: #202225; border: 1px solid #444; color: white; border-radius: 3px; font-size: 12px; box-sizing: border-box;">
                        
                        <button type="submit" style="background: #7289da; color: white; border: none; padding: 5px; width: 100%; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 11px;">שמור שינויים</button>
                    </form>

                    <button onclick="removeUserBot('${b.id}')" style="background: #ed4245; color: white; border: none; padding: 6px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 8px;">הסר בוט והחזר לספרייה</button>
                </div>
            `).join('')}
        </div>
    `;

    res.send(`
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>הבוטים שלי</title>
            <style>
                body { font-family: Arial, sans-serif; background: #1e1e1e; color: #fff; text-align: center; padding: 40px; }
                .container { max-width: 900px; margin: 0 auto; background: #36393f; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
                .back-link { display: inline-block; margin-bottom: 20px; background: #4f545c; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← חזרה לעמוד הראשי</a>
                <h2>פאנל הבוטים האישי של ${username}</h2>
                <p style="color: #bbb;">הבוטים שהוספת לשרתים שלך:</p>
                ${resultsHtml}
            </div>
            <script>
                function removeUserBot(id) {
                    if (confirm('האם אתה בטוח שברצונך להסיר את הבוט? הוא יאופס ויחזור לספרייה הראשית.')) {
                        fetch('/remove-user-bot/' + id, { method: 'DELETE' })
                            .then(res => window.location.reload());
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// שמירת עריכת פרטי השרת / Guild ID על ידי המשתמש
app.post('/edit-user-bot/:id', (req, res) => {
    const username = getCookie(req, 'username');
    if (!username) return res.redirect('/login');

    const { serverName, guildId } = req.body;
    let userBots = getUserBots();
    const botIndex = userBots.findIndex(b => b.id === req.params.id && b.username === username);

    if (botIndex !== -1) {
        if (serverName) userBots[botIndex].serverName = serverName.trim();
        if (guildId) userBots[botIndex].guildId = guildId.trim();
        saveUserBots(userBots);
    }

    res.redirect('/user-bots');
});

// מחיקת בוט מהרשימה האישית והחזרתו לספרייה הראשית
app.delete('/remove-user-bot/:id', (req, res) => {
    const username = getCookie(req, 'username');
    if (!username) return res.sendStatus(403);

    let userBots = getUserBots();
    const targetBot = userBots.find(b => b.id === req.params.id && b.username === username);

    if (targetBot) {
        userBots = userBots.filter(b => b.id !== req.params.id);
        saveUserBots(userBots);

        let bots = getBots();
        if (!bots.some(b => b.clientId === targetBot.clientId)) {
            bots.push({
                id: Date.now().toString(),
                name: targetBot.name,
                category: targetBot.category,
                clientId: targetBot.clientId,
                description: targetBot.description,
                token: ""
            });
            saveBots(bots);
        }
    }

    res.sendStatus(200);
});

// כניסת מנהל
app.get('/admin-login', (req, res) => {
    res.send(`
        <html lang="he" dir="rtl">
        <head><meta charset="UTF-8"><title>כניסת מנהל</title>
        <style>body{background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:100px;}</style></head>
        <body>
            <div style="background:#2f3136;max-width:400px;margin:auto;padding:30px;border-radius:8px;">
                <h2>הכנס סיסמת מנהל</h2>
                <form method="POST" action="/admin-login">
                    <input type="password" name="password" placeholder="סיסמה" style="padding:8px;width:80%;margin:10px 0;background:#202225;color:#fff;border:1px solid #444;border-radius:4px;"><br>
                    <button type="submit" style="background:#5865F2;color:#fff;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;">התחבר</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/admin-login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) {
        res.setHeader('Set-Cookie', 'admin_auth=true; Path=/; HttpOnly');
        res.redirect('/admin-panel');
    } else {
        res.send('<script>alert("סיסמה שגויה!"); window.location.href="/admin-login";</script>');
    }
});

// פאנל ניהול ראשי
app.get('/admin-panel', (req, res) => {
    const cookieHeader = req.headers.cookie || '';
    if (!cookieHeader.includes('admin_auth=true')) {
        return res.redirect('/admin-login');
    }

    const bots = getBots();
    const userBots = getUserBots();

    let botsHtml = bots.length === 0 ? '<p style="color: #aaa;">אין בוטים פעילים במערכת כרגע.</p>' : `
        <table style="width:100%; margin-top:10px; border-collapse: collapse; text-align: right;">
            <tr style="border-bottom: 1px solid #444; background: #202225;">
                <th style="padding: 10px;">שם הבוט</th>
                <th style="padding: 10px;">קטגוריה</th>
                <th style="padding: 10px;">Client ID</th>
                <th style="padding: 10px;">תאור</th>
                <th style="padding: 10px;">פעולה</th>
            </tr>
            ${bots.map(bot => `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 10px; font-weight: bold;">🤖 ${bot.name || 'בוט'}</td>
                    <td style="padding: 10px;">${bot.category || 'אחר'}</td>
                    <td style="padding: 10px;"><code>${bot.clientId || 'לא מוגדר'}</code></td>
                    <td style="padding: 10px;">${bot.description || '-'}</td>
                    <td style="padding: 10px;">
                        <button onclick="removeBot('${bot.id}')" style="background: #ed4245; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">הסר מהספרייה</button>
                    </td>
                </tr>
            `).join('')}
        </table>
    `;

    let userBotsHtml = userBots.length === 0 ? '<p style="color: #aaa;">אף משתמש עוד לא הוסיף בוטים לשרתים שלו.</p>' : `
        <table style="width:100%; margin-top:10px; border-collapse: collapse; text-align: right;">
            <tr style="border-bottom: 1px solid #444; background: #202225;">
                <th style="padding: 10px;">שם משתמש</th>
                <th style="padding: 10px;">תמונת ושם שרת</th>
                <th style="padding: 10px;">שם הבוט</th>
                <th style="padding: 10px;">מזהה שרת (Guild ID)</th>
                <th style="padding: 10px;">פעולה</th>
            </tr>
            ${userBots.map(ub => `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 10px; font-weight: bold; color: #5865F2;">👤 ${ub.username}</td>
                    <td style="padding: 10px; display: flex; align-items: center; gap: 8px;">
                        ${ub.serverImage ? `<img src="${ub.serverImage}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">` : '<span>🏠</span>'}
                        <span>${ub.serverName || 'ללא שם'}</span>
                    </td>
                    <td style="padding: 10px;">🤖 ${ub.name}</td>
                    <td style="padding: 10px;"><code>${ub.guildId || 'לא מצוין'}</code></td>
                    <td style="padding: 10px;">
                        <button onclick="removeUserBotByAdmin('${ub.id}')" style="background: #ed4245; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">אפס והחזר לספרייה</button>
                    </td>
                </tr>
            `).join('')}
        </table>
    `;

    res.send(`
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>פאנל ניהול מנהל</title>
            <style>
                body { font-family: Arial, sans-serif; background: #1e1e1e; color: #fff; text-align: center; padding: 40px; }
                h1 { color: #ed4245; }
                .container { max-width: 1000px; margin: 0 auto; background: #2f3136; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
                input, select, textarea { padding: 8px; margin: 5px 0; width: 100%; background: #202225; border: 1px solid #444; color: white; border-radius: 4px; box-sizing: border-box; }
                button.add-btn { background: #5865F2; color: white; border: none; padding: 10px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px; }
                .back-link { display: inline-block; margin-bottom: 20px; background: #4f545c; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; }
                .form-box { background: #36393f; padding: 20px; border-radius: 6px; text-align: right; margin-top: 20px; border: 1px solid #444; }
                .section-box { background: #36393f; padding: 20px; border-radius: 6px; text-align: right; margin-top: 30px; border: 1px solid #444; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← חזרה לעמוד הראשי</a>
                <h1>פאנל ניהול ראשי (מנהל בלבד)</h1>
                
                <div class="form-box">
                    <h3 style="margin-top:0; color:#fff; text-align:center;">➕ הוסף בוט חדש למערכת (עם טוקן)</h3>
                    <form action="/admin-add-bot" method="POST">
                        <input type="hidden" name="botAvatar" id="botAvatarInput">

                        <label style="font-size: 13px; color: #ccc;">קטגוריית הבוט:</label>
                        <select name="category">
                            <option value="הבוטים שלי (My Bots)">הבוטים שלי (My Bots)</option>
                            <option value="ניהול (Moderation)">ניהול (Moderation)</option>
                            <option value="מוזיקה (Music)">מוזיקה (Music)</option>
                            <option value="כרטיסים (Tickets)">כרטיסים (Tickets)</option>
                            <option value="קהילה (Community)">קהילה (Community)</option>
                            <option value="אחר (Other)">אחר (Other)</option>
                        </select>

                        <label style="font-size: 13px; color: #ccc;">שם חדש לבוט (אופציונלי):</label>
                        <input type="text" name="botName" placeholder="השאר ריק כדי להשאיר את השם הנוכחי בדיסקורד">

                        <label style="font-size: 13px; color: #ccc;">תמונת פרופיל חדשה לבוט (אופציונלי):</label>
                        <input type="file" id="botAvatarFile" accept="image/*" style="background: none; border: none; padding: 0;" onchange="convertBotAvatar(this)">

                        <label style="font-size: 13px; color: #ccc;">תיאור קצר:</label>
                        <textarea name="description" placeholder="תיאור הבוט..." rows="2"></textarea>

                        <label style="font-size: 13px; color: #ccc;">טוקן הבוט (Token):</label>
                        <input type="text" name="token" placeholder="הכנס טוקן כאן..." required>

                        <button type="submit" class="add-btn">הוסף בוט למערכת</button>
                    </form>
                </div>

                <div class="section-box">
                    <h3 style="margin-top: 0; text-align: right; color: #fff;">🤖 הבוטים הפעילים בספרייה הראשית</h3>
                    <div style="overflow-x: auto;">
                        ${botsHtml}
                    </div>
                </div>

                <div class="section-box">
                    <h3 style="margin-top: 0; text-align: right; color: #fff;">📋 כל הבוטים שהמשתמשים לקחו</h3>
                    <div style="overflow-x: auto;">
                        ${userBotsHtml}
                    </div>
                </div>
            </div>

            <script>
                function convertBotAvatar(input) {
                    const file = input.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            document.getElementById('botAvatarInput').value = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                }

                function removeBot(id) {
                    if (confirm('האם אתה בטוח שברצונך להסיר את הבוט מהספרייה?')) {
                        fetch('/remove-bot/' + id, { method: 'DELETE' })
                            .then(res => window.location.reload());
                    }
                }

                function removeUserBotByAdmin(id) {
                    if (confirm('האם אתה בטוח שברצונך לאפס בוט זה ולהחזירו לספרייה הראשית?')) {
                        fetch('/remove-user-bot-admin/' + id, { method: 'DELETE' })
                            .then(res => window.location.reload());
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/admin-add-bot', async (req, res) => {
    const { category, description, token, botName, botAvatar } = req.body;
    
    try {
        const cleanToken = token.trim();
        
        const updateData = {};
        if (botName && botName.trim()) updateData.username = botName.trim();
        if (botAvatar && botAvatar.startsWith('data:image')) updateData.avatar = botAvatar;

        if (Object.keys(updateData).length > 0) {
            const patchRes = await fetch('https://discord.com/api/v10/users/@me', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bot ${cleanToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!patchRes.ok) {
                const errJson = await patchRes.json();
                console.error('Discord API Error:', errJson);
            }
        }

        const response = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bot ${cleanToken}` }
        });

        if (!response.ok) {
            return res.send('<script>alert("הטוקן שגוי או לא חוקי."); window.location.href="/admin-panel";</script>');
        }

        const botData = await response.json();
        const bots = getBots();
        
        const existingIndex = bots.findIndex(b => b.clientId === botData.id);
        const newBotObj = { 
            id: Date.now().toString(), 
            name: botData.username, 
            category, 
            clientId: botData.id, 
            description: description ? description.trim() : '', 
            token: cleanToken 
        };

        if (existingIndex !== -1) {
            bots[existingIndex] = newBotObj;
        } else {
            bots.push(newBotObj);
        }
        
        saveBots(bots);
        res.send('<script>alert("הבוט נוסף והשם/תמונה עודכנו בהצלחה!"); window.location.href="/admin-panel";</script>');
    } catch (error) {
        console.error(error);
        res.send('<script>alert("שגיאה בהתחברות לדיסקורד."); window.location.href="/admin-panel";</script>');
    }
});

app.delete('/remove-bot/:id', (req, res) => {
    const botId = req.params.id;
    let bots = getBots();
    bots = bots.filter(b => b.id !== botId);
    saveBots(bots);
    res.sendStatus(200);
});

app.delete('/remove-user-bot-admin/:id', (req, res) => {
    let userBots = getUserBots();
    const targetBot = userBots.find(b => b.id === req.params.id);

    if (targetBot) {
        userBots = userBots.filter(b => b.id !== req.params.id);
        saveUserBots(userBots);

        let bots = getBots();
        if (!bots.some(b => b.clientId === targetBot.clientId)) {
            bots.push({
                id: Date.now().toString(),
                name: targetBot.name,
                category: targetBot.category,
                clientId: targetBot.clientId,
                description: targetBot.description,
                token: ""
            });
            saveBots(bots);
        }
    }
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
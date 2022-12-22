const app = require('express')()
const server = require('http').createServer(app)
const cors = require('cors');
const { writeFileSync } = require('fs');
const io = require('socket.io')(server,{
    cors : {
        origin :"*",
        credentials :true
    }
});
const mysql = require('mysql2'); 
const pool = mysql.createPool({
    host : 'localhost',
    user : 'root',
    password : 'black',
    database : 'chat',
    port:3306
});


io.on('connection', async socket =>{
    socket.emit('welcome');

    socket.on('createConversation',async ({info}) => {
        await createConversation(socket, info);
    });

    socket.on('loadConversation', async({userId}) => {
        loadConversation(socket, userId);
    });

    socket.on('join', ({room}) => {
        socket.join(room);
        console.log(socket.id + " is joined " + room);
    });

    socket.on('leave', ({room}) => {
        socket.leave(room);
        console.log(socket.id + " is leaved " + room);
    });

    socket.on('message',async ({conversationId, userId, name, message, image, messageType, updated}) => {

        const conn = pool.promise();
        let messageId = 0;
        try {
            const [result,fields] = await conn.query(`INSERT INTO message VALUES(null, ${conversationId}, ${userId}, ${messageType}, '${message}', from_unixtime(${updated}), ${image == null ? null : "'" + image + "'"}, '${name}')`);
            messageId = result.insertId; 
            await conn.query(`UPDATE conversation SET last_message_id = ${messageId} WHERE id=${conversationId}`);
        } catch(err) {
            console.log(err);
        }
        
        io.sockets.in(conversationId).emit('message', ({
            messageId : messageId,
            conversationId : conversationId, 
            userId : userId, 
            name : name,
            message : message, 
            image : image,
            messageType : messageType, 
            updated : updated
        }));

    });

    socket.on('readinfo', async ({conversationId, userId, lastMessageId}) => {        

        const conn = pool.promise();
        if(lastMessageId == null) {
            try {
                const [rows, fields] = await conn.query(`SELECT last_message_id FROM conversation WHERE id = ${conversationId}`);
                lastMessageId = rows[0].last_message_id;
            } catch(err) {
                console.log(err);
            }
        }
        try{
            await conn.query(`INSERT INTO read_info VALUES(null, ${conversationId}, ${userId}, ${lastMessageId})`);
        }catch(err){
            console.log(err);
        }

        io.sockets.in(conversationId).emit('readinfo', ({
            conversationId : conversationId, 
            userId : userId,
            lastMessageId : lastMessageId
        }));

    });

    socket.on('disconnect', function() {

        console.log("SOCKETIO disconnect EVENT: ", socket.id, " client disconnect");
        var rooms = io.sockets.adapter.sids[socket.id];
        for(var room in rooms) {
            socket.leave(room);
        }   
    });

    socket.on('loadmessage', async ({conversationId, offset, size}) => {
        const conn = pool.promise();
        try {
            const [rows, fields] = await conn.query(`SELECT * FROM (SELECT id,conversation_id,user_id,message_type,message,unix_timestamp(updated) as updated,image,name FROM message WHERE conversation_id=${conversationId} order by id desc) orders limit ${size} offset ${offset}`);
            socket.emit('loadmessage', ({
              rows : rows  
            }));

        } catch(err){
            console.log(err);
        }
    });

    socket.on('loadreadinfo', async({conversationId}) => {
        const conn = pool.promise();
        try {
            const [rows, fields] = await conn.query(`select user_id, max(last_message_id) as last_message_id from read_info where user_id in (select user_id from user_conversation where conversation_id=${conversationId}) and conversation_id=${conversationId} group by user_id`);
            for(let row of rows) {

                socket.emit('readinfo', ({
                    conversationId : conversationId,
                    userId : row.user_id,
                    lastMessageId : row.last_message_id
                  }));

            }
            

        } catch(err){
            console.log(err);
        }
    });

    socket.on('outconversation', async ({userId, name, conversationId}) => {

        const conn = pool.promise();
        try {

            const [rows, fields] = await conn.query(`SELECT user_count, title FROM conversation WHERE id=${conversationId}`);
            let userCount = rows[0].user_count;
            if(userCount == 1) {
                await conn.query(`DELETE FROM conversation WHERE id = ${conversationId}`);
                await conn.query(`DELETE FROM user_conversation WHERE conversation_id = ${conversationId}`);

            } else {
                userCount -= 1;
                let title = rows[0].title;
                if(title.indexOf(name)===0) {
                    title = title.substr(name.length + 1);
                } else {
                    title = title.split("," + name).join("");
                }
                await conn.query(`UPDATE conversation SET user_count = ${userCount}, title='${title}' WHERE id=${conversationId}`);
                await conn.query(`DELETE FROM user_conversation WHERE user_id = ${userId} AND conversation_id = ${conversationId}`);
                await conn.query(`INSERT INTO message VALUES(null, ${conversationId}, ${userId}, 3, '', current_timestamp(), null, '${name}')`);

                io.sockets.to(conversationId).emit('message', ({
                    conversationId : conversationId,
                    userId : userId, 
                    name : name, 
                    message : '',
                    messageType : 3,
                    updated : Date.now()
                }));
            }

        } catch(err) {
            console.log(err);
        }

    });

    socket.on('uploadImage', ({file, name}) => {
        console.log('uploadImage ' + name);
        let path = "../client/public/img/";
        let filename = Date.now() + name;
        writeFileSync(path + filename, file);
        socket.emit('uploadImage', ({
            filename :  filename
        }));
    });

});


async function getUnreadCountForConversation(convId, userId) {

    const conn = pool.promise();
    try{
        const [rows,fields] = await conn.query(`SELECT MAX(last_message_id) AS last_message_id FROM read_info WHERE user_id=${userId} AND conversation_id=${convId}`);
        const lastMessageId = rows[0].last_message_id;
        const [rows2,fields2] = await conn.query(`SELECT COUNT(*) as unreads FROM message WHERE id > ${lastMessageId} AND conversation_id = ${convId} AND message_type != 3`);
        return rows2[0].unreads;

    }catch(err){
        console.log(err);
    }
    return 0;
}


async function loadConversation(socket, userId) {
    console.log('loadConversation');
    const conn = pool.promise();
    try{
        const [rows,fields] = await conn.query(`SELECT * FROM conversation WHERE id IN (select conversation_id from user_conversation where user_id = ${userId})`);
        
        for(let row of rows) {
            const [rows2,fields2] = await conn.query(`SELECT message_type, message, unix_timestamp(updated) as updated FROM message WHERE id=${row.last_message_id}`);
            row.unreads = await getUnreadCountForConversation(row.id, userId);
            row.userId = userId;

            if(rows2 != null && rows2.length > 0) {
                row.messageType = rows2[0].message_type;
                row.message = rows2[0].message;
                row.updated = rows2[0].updated;
            }
            
        }
        const data = JSON.stringify(rows);
        socket.emit('loadConversation', ({
            result : 'success', 
            data : data
        }));
    }catch(err) {
        console.log(err);
        socket.emit('loadConversation', ({result:'fail'}));
    }
}


async function createConversation(socket, info) {
    console.log('createConversation');
    let users = JSON.parse(info);
    console.log(users);
    let userCount = users.length;
    if(userCount == 0) {
        console.log('createConversation::user count = 0');
        return;
    }
    let name = users[0].name;
    let thumbnail = users[0].profile;
    if(users.length >= 2) {
        thumbnail = users[1].profile;
    }
    for(var user of users) {
        if(name === user.name) {
            continue;
        }
        name = name + "," + user.name;
    }

    let convId = 0;
    const conn = pool.promise();
    try {
        const [rows, fields] = await conn.query(`INSERT conversation VALUES(null, '${thumbnail}', '${name}', 0, ${userCount})`);
        convId = rows.insertId;
        console.log("createConversation::convId = " + convId)
        for(var user of users) {
            await conn.query(`INSERT user_conversation VALUES(null, ${user.id}, ${convId}, false, true)`);
        }
        console.log('createConversation::success');
    } catch(err) {
        console.log(err);
        socket.emit('createConversation',({result:"fail"}) );
        return;
    }

    socket.emit('createConversation',({result:"success"}) );
    
    
}

server.listen(1225, function(){
    console.log('listening on port 1225');
});
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';


const socket = io.connect('http://localhost:1225')

function User(id, name) {
  this.id = id;
  this.name = name;
}

function Message(id, name, message, image, updated, readCount) {
  this.id = id;
  this.name = name;
  this.message = message; 
  this.image = image; 
  this.updated = updated;
  this.readCount = readCount;
}

function Conversation(id, thumb, title, unreads, userCount, lastMessageId) {
  this.id = id;
  this.thumb = thumb;
  this.title = title;
  this.unreads = unreads;
  this.userCount = userCount;
  this.lastMessageId = lastMessageId;
}

let info = [
  {
    id : 1,
    name : "아이유",
    profile : "iu.PNG"
  },
  {
    id : 2,
    name : "유인나",
    profile : "ui.PNG"
  }
];

let lastUpdated = [];
let copyMsg = [];
let copyConvItem;
let myId = 1; 

function App() {
  let [select, setSelect] = useState(new User(1, "아이유"));
  let [chatList, setChatList] = useState([]);
  let [convItem, setConvItem] = useState(new Conversation(0, "", "", 0, 0));
  let [msg, setMsg] = useState([]);
  let [imgPath, setImgPath] = useState("");
  
  useEffect(()=>{
    init();
  }, []);
  


  return (
    <div className="App">
      
      <div>
        <div>
          <p>선택된 유저 : {select != null ? select.name : ""}</p>

        </div>
        <p>UsersList</p>
          <button onClick={()=>changeUser(1, "아이유")}>아이유</button>
          <button onClick={()=>changeUser(2, "유인나")}>유인나</button>
      </div>
      
      <br></br>
      <hr></hr>
      <br></br>
      
      <button onClick={()=>createConversation()}>채팅방 DB 생성</button>
      <div id = "chatjson">
        <p>[채팅방 유저정보] <button onClick={()=>showChatJson()}>보기</button></p>
      </div>

      <br></br>
      <hr></hr>
      <br></br>

      <div>
        <p>채팅방 목록 <button onClick={()=>loadConversation()}>불러오기</button></p>
        <ul id="chatlist">
          {
          chatList.map( (item, idx) => {

            console.log(item);


            return (
              <div key={item.id}>
                <li style={{display:'inline'}} onClick={()=>openChat(item)} >id : {item.id} / thumbnail : {item.thumbnail} / title : {item.title} / userCount : {item.user_count} / unreads : {item.unreads}</li>
                &nbsp;&nbsp;<button onClick={()=>outConversation(item, idx)}>나가기</button>
              </div>
            );
          })
          }
        </ul>
      </div>
      
      
      <br></br>
      <hr></hr>
      <br></br>
      
      <div>
        <p>접속된 채팅방 : [{convItem.id}]{convItem.title} // 내 이름 : {select.name}</p>
        <input type="text" id="message"></input><button onClick={()=>send()}>전송</button>
        <hr />
        <br></br>&nbsp;&nbsp;<input type="file" onChange={uploadImage.bind(this)} />
        <br></br>
        <button onClick={()=>setImgPath()}>이미지 선택 취소</button>
        <img src={"/img/" + imgPath} alt='preview' width={50} />
        <br></br><br></br>
        <center><button style={{display : `${imgPath === "" ? 'none': 'block'}`}} onClick={()=>sendImage()}>이미지 전송</button></center>
        <hr />
        <ul id="chat">
          {
            msg.map( (item, idx) => {
              
              return (
                <li key={idx}>{item.name} : <img width={100} style={{display : `${item.image == null ? 'none' : 'inline-block'}`}} src={"/img/" + item.image} alt={idx} />{item.image == null ? item.message : ""} <small>{item.updated}</small> <small>unreads:{item.readCount}</small></li>
              );

            })
          }
        </ul>
      </div>


    </div>
  );

  function sendImage() {
    if(convItem.id === 0) {
      alert('채팅방을 선택해주세요.');
      return;
    }
    
    if(imgPath === "") {
      return;
    }
  
    let messageType = 2;
    let updated = parseInt(Date.now()*0.001);

    console.log('send image message!');

    socket.emit("message", ({
      conversationId : copyConvItem.id, 
      userId : myId,
      name : select.name,
      message : '',
      image : imgPath,
      messageType : messageType, 
      updated : updated
    }));

    setImgPath("");
  }

  function uploadImage(event) {
    const files = event.target.files;
    console.log(files[0].name);
    socket.emit('uploadImage', ({file : files[0], name : files[0].name}));
  }


  function outConversation(item, idx) {
    chatList.splice(idx, 1);
    let newList = [];
    chatList.map((value, idx) => {
      newList.push(value);
    });
    setChatList(newList);

    const userId = myId;
    const conversationId = item.id;
    const name = select.name;

    socket.emit("outconversation", ({
      userId : userId,
      name : name,
      conversationId : conversationId
    }));

    //socket emit out conversation
    /**
     * if(usercount != 1) {
     *  update conversation name and user count
     *  remove user_conversation where userid is myid
     *  emit out message
     * } else {
     *    remove conversation where conv id = convid
     *    remove user_conversation where conv id = convId
     * }
     */
  }

  function changeUser(id, name) {
    setSelect(new User(id, name));
    myId = id;
    loadConversation();
  } 


  function openChat(item) {
    if(convItem.id !== 0 && item.id !== convItem.id) {
      socket.emit('leave', ({room : convItem.id}));
    }
    setConvItem(new Conversation(item.id, item.thumbnail, item.title, item.unreads, item.user_count, item.last_message_id));
    copyConvItem = new Conversation(item.id, item.thumbnail, item.title, item.unreads, item.user_count, item.last_message_id);
    socket.emit('join', ({room : item.id}));
    setMsg([]);
    copyMsg = [];
    socket.emit('readinfo', ({
      conversationId : copyConvItem.id,
      userId : myId
    }));

    socket.emit('loadmessage', ({
      conversationId : copyConvItem.id,
      offset:0,
      size:5
    }));

    socket.emit('loadreadinfo', ({
      conversationId : copyConvItem.id
    }));
    

    console.log('open chat~!!');
  }

  function loadConversation() {
    socket.emit("loadConversation",({
      userId : myId
    }));
  }


  function send() {
    if(convItem.id === 0) {
      alert('채팅방을 선택해주세요.');
      return;
    }
    let text = document.getElementById('message').value;
    document.getElementById('message').value = "";
    if(text === "") {
      return;
    }
    
  
    let messageType = 1;
    let updated = parseInt(Date.now()*0.001);

    console.log('send message!');

    socket.emit("message", ({
      conversationId : copyConvItem.id, 
      userId : myId,
      name : select.name,
      message : encodeURIComponent(text),
      messageType : messageType, 
      updated : updated
    }));
  }

  function showChatJson() {
    let text = document.getElementById('chatjson').innerHTML;
    var infoStr = JSON.stringify(info);
    document.getElementById('chatjson').innerHTML = text + infoStr;
  }

  function createConversation() {
    var infoStr = JSON.stringify(info);
    socket.emit("createConversation",({
      info : infoStr
    }));
    console.log("create conversation~!");

  }


  function init() {
    socket.on('welcome',() => {
      console.log('welcome~~!');
    });

    socket.on('createConversation',({result})=>{
      alert(result);
    });

    socket.on('loadConversation', ({data, result}) => {
      if(result === 'fail') {
        alert(result);
        return;
      }
      const rows = JSON.parse(data);
      setChatList(rows);
    });


    socket.on('message', ({messageId, conversationId, userId, name, message, image, messageType, updated}) => {
      
      let text = decodeURIComponent(message);
      if(messageType === 3) {
        text = `${name}님이 퇴장했습니다.`;
        name = 'system';
      }

      
      setMsg(msg => [...msg, new Message(messageId, name , text, image, updated)]);
      copyMsg.push(new Message(messageId, name , text, image, updated, convItem.userCount));
      socket.emit('readinfo', ({
        conversationId : conversationId,
        userId : myId,
        lastMessageId : messageId
      }));
    });


    socket.on('readinfo', ({conversationId, userId, lastMessageId}) => {
      console.log(`${userId} readed, last msg id = ` + lastMessageId);
      let findout = false;
      for(var item of lastUpdated) {
        if(item.userId === userId) {
          item.updated = lastMessageId;
          findout = true;
        }
      }
      if(!findout) {
        lastUpdated.push({userId : userId, updated : lastMessageId});
      }
      let newMsg = [];
      for(let item of copyMsg) {
        let sum = 0;
        for(let updateItem of lastUpdated) {
          if(updateItem.updated >= item.id) {
            sum+=1;
          }
        }
        if (item.name === 'system') {
          item.readCount = 0;
        } else {
          item.readCount = copyConvItem.userCount - sum;
        }
        newMsg.push(item);
      }
      setMsg(newMsg);
      
    });


    socket.on('loadmessage', ({rows}) => {
      
      let preload = [];
      
      for(let i=rows.length-1;i>=0;i--) {
        let row = rows[i];
        let text = decodeURIComponent(row.message);
        let name = row.name;
        if(row.message_type === 3) {
          text = `${row.name}님이 퇴장했습니다.`;
          name = 'system';
        }

        preload.push(new Message(row.id, name, text, row.image, row.updated, convItem.userCount));
        copyMsg.push(new Message(row.id, name, text, row.image, row.updated, convItem.userCount));
      }
      setMsg(preload);
    });


    socket.on('uploadImage', ({filename}) => {

      setImgPath(filename);

    });


  }






}



export default App;

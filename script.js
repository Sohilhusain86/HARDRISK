// 1. अपना ScaleDrone Channel ID यहाँ डालें (ScaleDrone वेबसाइट से मिलेगा)
const CHANNEL_ID = uledCtWauV1C5nWP; 
const ROOM_NAME = 'observable-chat-room'; // 'observable-' लगाना जरूरी है

// ScaleDrone शुरू करें
const drone = new ScaleDrone(CHANNEL_ID);

drone.on('open', error => {
  if (error) {
    return console.error('ScaleDrone एरर:', error);
  }
  console.log('ScaleDrone कनेक्ट हो गया!');

  // रूम में शामिल हों
  const room = drone.subscribe(ROOM_NAME);
  
  room.on('open', error => {
    if (error) {
      console.error('रूम एरर:', error);
    } else {
      console.log('रूम से जुड़ गए!');
    }
  });

  // 2. जब भी कोई नया मैसेज आए, तो यह कोड चलेगा
  room.on('data', (messageText, member) => {
    console.log('नया मैसेज आया:', messageText);
    
    // स्क्रीन पर मैसेज दिखाने के लिए (अपने HTML के ID के अनुसार इसे बदलें)
    // उदाहरण: document.getElementById('chat-box').innerHTML += '<p>' + messageText + '</p>';
  });
});

// 3. मैसेज भेजने का फंक्शन (इसे अपने 'Send' बटन के onclick पर लगाएँ)
function sendMessage(text) {
  if (text.trim() === '') return;
  
  drone.publish({
    room: ROOM_NAME,
    message: text
  });
}

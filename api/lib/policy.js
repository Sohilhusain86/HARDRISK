const STUDY = /(study|exam|homework|lesson|subject|math|algebra|geometry|physics|chemistry|biology|science|history|geography|english|grammar|arabic|urdu|hindi|translation|translate|summar|summary|notes|quiz|question|answer|explain|definition|formula|theorem|tajweed|quran|hadith|fiqh|nahw|sarf|adab|literature|programming|code|computer|ai|research|assignment|revision|memorize|memorisation|مطالعہ|تعلیم|امتحان|سبق|سوال|جواب|ترجمہ|تشریح|نحو|صرف|تجوید|قرآن|حدیث|فقہ|ادب)/i;
const OFF_TOPIC = /(porn|sex|dating|gambling|casino|betting|weapon|drug|hack.*account|steal.*password|credit card fraud|malware|ransomware|phishing|violence.*how to|kill.*how to)/i;
function allowed(text){
  if (!text || text.trim().length < 2) return {ok:false,reason:'EMPTY'};
  if (OFF_TOPIC.test(text)) return {ok:false,reason:'SAFETY'};
  if (STUDY.test(text)) return {ok:true};
  // Short neutral study-like prompts are passed; broad non-study requests are rejected.
  if (text.trim().split(/\s+/).length <= 6 && /[?؟]$/.test(text.trim())) return {ok:true};
  return {ok:false,reason:'STUDY_ONLY'};
}
const refusal = 'میں SUHAIL AI ہوں اور اس ایپ میں صرف تعلیمی مدد فراہم کرتا ہوں۔ اپنا سوال کسی تعلیمی موضوع، سبق، امتحان یا مطالعے سے متعلق بھیجیں۔';
module.exports={allowed,refusal};

const fs = require('fs');
const path = 'frontend/src/pages/FeedbackPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const startSearch = '{isAdmin ? (';
const startIdx = content.indexOf(startSearch, 30000);
const endSearch = ')}'; // Closing of AnimatePresence
const endIdx = content.indexOf(endSearch, startIdx + 100);
const actualEndIdx = content.indexOf(')', endIdx + 2); // Closing of isAdmin ? ( ... )

// The structural block we want to fix is from isAdmin to the closing of the ternary
const fullBlockStart = content.lastIndexOf('{isAdmin ? (', content.indexOf('WhatsApp Input Area'));
const fullBlockEnd = content.indexOf(')}', content.indexOf('לא ניתן לשלוח הודעות נוספות בשיחה זו')) + 2;

const replacement = `{isAdmin ? (
                          <div className="bg-[#f0f2f5] dark:bg-[#202C33] p-2 flex items-end gap-2 shrink-0 z-20">
                             <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-[24px] min-h-[44px] flex items-center px-4 shadow-sm">
                                <input 
                                  type="text"
                                  value={replyText} 
                                  onChange={(e) => setReplyText(e.target.value)} 
                                  placeholder="הקלד הודעה..." 
                                  className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-2.5 outline-none font-medium"
                                  onKeyDown={(e) => { if(e.key === "Enter" && replyText.trim()) handleAdminReply("closed"); }}
                                />
                             </div>
                             <AnimatePresence mode="wait">
                               {replyText.trim() ? (
                                  <motion.div key="send-btn" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                    <Button 
                                      onClick={() => handleAdminReply("closed")} 
                                      className="rounded-full w-11 h-11 p-0 shrink-0 bg-[#00A884] hover:bg-[#00A884]/90 text-white shadow-md flex items-center justify-center transition-all active:scale-90"
                                    >
                                      <Send className="w-5 h-5 rtl:rotate-180 -ml-1" />
                                    </Button>
                                  </motion.div>
                               ) : (
                                  <motion.div key="icon-placeholder" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-11 h-11 flex items-center justify-center text-muted-foreground/50">
                                     <MessageCircle className="w-6 h-6" />
                                  </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       ) : (
                          <div className="p-3 bg-[#f0f2f5] dark:bg-[#202C33] text-center border-t border-black/5 shrink-0">
                            <span className="text-[12px] font-bold text-muted-foreground/70 bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full shadow-sm">
                              הפנייה נסגרה. לא ניתן לשלוח הודעות נוספות.
                            </span>
                          </div>
                       )}`;

// We need to be very careful here. Let's find the exact indices.
const searchAreaStart = content.indexOf('WhatsApp Input Area') - 50;
const searchAreaEnd = content.indexOf('לא ניתן לשלוח הודעות נוספות בשיחה זו') + 200;

if (searchAreaStart > 0 && searchAreaEnd > searchAreaStart) {
    const area = content.substring(searchAreaStart, searchAreaEnd);
    // Find the ternary block within this area
    const ternaryStart = area.indexOf('{isAdmin ? (');
    const ternaryEnd = area.lastIndexOf(')}');
    
    if (ternaryStart !== -1 && ternaryEnd !== -1) {
        const finalContent = content.substring(0, searchAreaStart + ternaryStart) + replacement + content.substring(searchAreaStart + ternaryEnd + 2);
        fs.writeFileSync(path, finalContent, 'utf8');
        console.log('Successfully fixed the structural issue in input area');
    } else {
        console.error('Could not find ternary block boundaries');
    }
} else {
    console.error('Could not find search area');
}

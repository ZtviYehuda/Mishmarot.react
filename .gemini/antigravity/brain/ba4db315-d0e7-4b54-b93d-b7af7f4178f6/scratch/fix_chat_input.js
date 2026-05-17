const fs = require('fs');
const path = 'frontend/src/pages/FeedbackPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const startTag = '{isAdmin ? (';
const endTag = ') : (';
const startIndex = content.indexOf(startTag, 30000); // Start searching from chat area
const endIndex = content.indexOf(endTag, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const partToReplace = content.substring(startIndex, endIndex);
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
                          </div>`;
    
    const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Successfully replaced block using index search');
} else {
    console.error('Could not find start/end tags');
}

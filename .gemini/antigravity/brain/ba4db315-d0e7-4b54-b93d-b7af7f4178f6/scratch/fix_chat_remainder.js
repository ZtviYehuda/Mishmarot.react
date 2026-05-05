const fs = require('fs');
const path = 'frontend/src/pages/FeedbackPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Admin Response Bubble
const adminStart = 'activeThread.admin_reply && (';
const adminIndex = content.indexOf(adminStart, 30000);
const adminBlockEnd = ')}'; // First closing after the bubble
const adminEndIndex = content.indexOf(adminBlockEnd, adminIndex) + 2;

if (adminIndex !== -1) {
    const replacement = `activeThread.admin_reply && (
                            <div className="flex justify-end w-full mb-4">
                              <div className="flex flex-col max-w-[85%] md:max-w-[70%] items-end">
                                 <div className="p-2.5 px-3 bg-[#D9FDD3] dark:bg-[#005C4B] text-[#111B21] dark:text-[#E9EDEF] rounded-[12px] rounded-tl-[4px] shadow-[0_1px_1px_rgba(0,0,0,0.1)] relative">
                                    <p className="text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap">{activeThread.admin_reply}</p>
                                    <div className="flex justify-end mt-1">
                                       <span className="text-[10px] opacity-60">
                                          {new Date(activeThread.updated_at || activeThread.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                            </div>
                          )}`;
    content = content.substring(0, adminIndex) + replacement + content.substring(adminEndIndex);
}

// 2. Closing Message
const closingStart = ') : ('; // This is after the isAdmin block we just replaced
const closingIndex = content.indexOf(closingStart, 34000);
const closingEnd = ')}';
const closingEndIndex = content.indexOf(closingEnd, closingIndex) + 2;

if (closingIndex !== -1) {
    const replacement = `) : (
                          <div className="p-3 bg-[#f0f2f5] dark:bg-[#202C33] text-center border-t border-black/5 shrink-0">
                            <span className="text-[12px] font-bold text-muted-foreground/70 bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full shadow-sm">
                              הפנייה נסגרה. לא ניתן לשלוח הודעות נוספות.
                            </span>
                          </div>
                       )}`;
    content = content.substring(0, closingIndex) + replacement + content.substring(closingEndIndex);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated admin bubbles and closing message');

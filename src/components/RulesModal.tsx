import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
    >
      <div
        dir="rtl"
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-[#FFE082] shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #6AD5E8 0%, #35A6CC 35%, #18729A 100%)',
        }}
      >
        {/* Top Header */}
        <div className="pt-4 pb-2 px-4 flex items-center justify-between relative z-20">
          {/* Back Button */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-b from-[#FFF2CF] to-[#DEC089] border border-[#B3874B] shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="رجوع"
          >
            <span className="text-[#6D4213] text-xl font-bold leading-none pointer-events-none">↩</span>
          </button>

          {/* Title: قواعد */}
          <h2
            className="font-black text-2xl text-[#1E3A5F] flex-1 text-center"
            style={{
              fontFamily: "'Tajawal', sans-serif",
              textShadow: '0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            قواعد
          </h2>

          <div className="w-10" />
        </div>

        {/* Parchment/Card Container */}
        <div className="px-3 pb-4">
          <div
            className="rounded-2xl p-4 sm:p-5 border-2 border-[#FFE082] shadow-inner text-white space-y-3.5 max-h-[460px] overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, #2EA5C9 0%, #177C9F 100%)',
              lineHeight: '1.7',
            }}
          >
            <div className="text-sm sm:text-base font-bold text-cyan-50">
              اولا. الرجاء اختيار المبلغ والطعام الذي ترغب في المراهنة عليه ؛
            </div>

            <div className="text-sm sm:text-base font-bold text-cyan-50">
              ثانيا. وقت المراهنة هو 30 ثانية في كل جولة وسيتم الإعلان عن الفائزين بعد الرهان.
            </div>

            <div className="text-sm sm:text-base font-bold text-cyan-50">
              ثالثا. جميع اللاعبين الذين يراهنون على الطعام الفائز بالجائزة سيحصلون على الكونز المقابلة وفق المضاعفات التالية:
              <div className="mt-1.5 pr-3 grid grid-cols-2 gap-1 text-xs text-yellow-200 font-extrabold">
                <div>• السمك: 45 ضعفاً</div>
                <div>• اللحم: 25 ضعفاً</div>
                <div>• الدجاج: 15 ضعفاً</div>
                <div>• الروبيان: 10 أضعاف</div>
                <div>• البروكلي: 5 أضعاف</div>
                <div>• الطماطم: 5 أضعاف</div>
                <div>• الذرة: 5 أضعاف</div>
                <div>• الجزر: 5 أضعاف</div>
              </div>
            </div>

            <div className="text-sm sm:text-base font-bold text-cyan-50">
              رابعا. يمكنك المراهنة على ما يصل إلى 6 أنواع من الطعام في كل جولة وليس هناك حد لمبلغ الرهان ؛
            </div>

            <div className="text-sm sm:text-base font-bold text-cyan-50">
              خامسا. تتسع مجموعة الجوائز مع انضمام المزيد والمزيد من اللاعبين ، وزيادة فرصة اختيار البيتزا أو السلطة عندما يصل المسبح إلى نطاق معين ؛
            </div>

            <div className="text-sm sm:text-base font-bold text-cyan-50">
              سادسا. إذا كانت النتيجة سلطة ، سيفوز كل اللاعبين الذين يراهنون على الخضار.
            </div>

            <div className="text-sm sm:text-base font-bold text-cyan-50">
              سابعا. إذا كانت النتيجة بيتزا ، سيفوز كل اللاعبين الذين يراهنون على اللحوم.
            </div>

            <div className="text-sm sm:text-base font-bold text-cyan-50">
              ثامنا. سيتم تحديث الترتيب والمكاسب اليومية في كل يوم.
            </div>

            {/* Official ToTi Chat Copyright & Management Clause */}
            <div className="text-xs sm:text-sm font-bold bg-[#0D4B60]/80 p-3 rounded-xl border border-yellow-300/50 text-yellow-300">
              تاسعا. جميع الحقوق محفوظة لشركة توتي شات (ToTi Chat)، والشركة هي الجهة المسؤولة عن إدارة اللعبة وقواعدها ونظام المكافآت والتحديثات والتفسير الرسمي لجميع أحكامها، ولا يجوز اعتماد أي تفسير أو تعديل للقواعد خارج إدارة شركة توتي شات.
            </div>
          </div>

          {/* Version */}
          <div className="text-left mt-2 px-1 text-[11px] font-semibold text-cyan-200/70">
            v1.11.0
          </div>
        </div>
      </div>
    </div>
  );
};

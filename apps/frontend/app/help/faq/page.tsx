import Link from 'next/link';

const faqItems = [
  {
    id: 'account',
    question: 'What is FWAYA?',
    answer: 'FWAYA is a digital platform for discovering, enjoying, sharing and supporting music, video and creative content.',
  },
  {
    id: 'help',
    question: 'How do I get help?',
    answer: 'Message FWAYA Support on WhatsApp at 0966 999 999 or email support@fwaya.net.',
  },
  {
    id: 'payment',
    question: 'My payment went through but I cannot access my content. What should I do?',
    answer: 'Send your payment reference and registered phone number to FWAYA Support on WhatsApp.',
  },
  {
    id: 'password',
    question: 'I forgot my password. What should I do?',
    answer: 'Select Forgot Password on the login page. If you still need help, contact FWAYA Support.',
  },
  {
    id: 'report',
    question: 'How do I report something that is not working?',
    answer: 'Use Report Issues or WhatsApp us on 0966 999 999.',
  },
];

export default function HelpFaqPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-black p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300">FAQ</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Quick answers. No long searching.</h1>
        </div>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <div key={item.id} id={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">{item.question}</h2>
              <p className="mt-2 text-sm text-gray-300">{item.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-gray-200">
          Need more help? <Link href="/help/contact" className="text-purple-300">Contact support</Link> or reach us on WhatsApp at <a href="https://wa.me/260966999999" className="text-purple-300">0966 999 999</a>.
        </div>
      </div>
    </div>
  );
}

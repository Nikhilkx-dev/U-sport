const Sport = require('../models/Sport');

const chatbotService = async (message, userId) => {
  const msg = message.toLowerCase().trim();

  // Sports list
  if (msg.includes('sports') || msg.includes('list') || msg.includes('available')) {
    try {
      const sports = await Sport.find();
      const outdoor = sports.filter(s => s.category === 'outdoor');
      const indoor = sports.filter(s => s.category === 'indoor');
      return `🏟️ **Available Sports at U-SPORT:**\n\n**Outdoor Sports:**\n${outdoor.map(s => `• ${s.icon || '🏅'} ${s.name} — ${s.availableFacilities}/${s.totalFacilities} available`).join('\n')}\n\n**Indoor Sports:**\n${indoor.map(s => `• ${s.icon || '🏅'} ${s.name} — ${s.availableFacilities}/${s.totalFacilities} available`).join('\n')}`;
    } catch {
      return 'Sorry, I could not fetch sports data right now.';
    }
  }

  // Specific sport availability
  const sportNames = ['cricket', 'football', 'basketball', 'volleyball', 'pickleball', 'tennis', 'skating', 'badminton', 'carrom', 'chess', 'table tennis'];
  for (const sport of sportNames) {
    if (msg.includes(sport)) {
      try {
        const s = await Sport.findOne({ name: new RegExp(sport, 'i') });
        if (s) {
          return `${s.icon || '🏅'} **${s.name}**\n• Category: ${s.category}\n• Total Facilities: ${s.totalFacilities}\n• Currently In Use: ${s.usedFacilities}\n• Available: ${s.availableFacilities}\n\n${s.availableFacilities > 0 ? '✅ Available for booking!' : '❌ All facilities are currently in use.'}`;
        }
      } catch {}
    }
  }

  // Booking process
  if (msg.includes('book') || msg.includes('request') || msg.includes('how to')) {
    return `📋 **How to Book a Facility:**\n\n1. Go to **Student Dashboard**\n2. Browse available sports\n3. Click **"Request"** on a sport card\n4. Fill in: Name, Roll No, Start Time, End Time, Purpose\n5. Submit request\n6. Faculty will approve/reject\n7. Track status in **My Requests**\n\n💡 Tip: Booking is not available during **4 PM - 5 PM IST** (maintenance).`;
  }

  // Maintenance time
  if (msg.includes('maintenance') || msg.includes('closed') || msg.includes('timing') || msg.includes('time')) {
    return `🔧 **Maintenance Schedule:**\n\nSports facilities are closed for maintenance every day from **4:00 PM to 5:00 PM IST**.\n\nDuring this time:\n• No new bookings can be made\n• A maintenance banner will be shown\n• All backend requests will be rejected\n\n✅ Bookings are available at all other times!`;
  }

  // Equipment
  if (msg.includes('equipment') || msg.includes('bat') || msg.includes('racket') || msg.includes('ball')) {
    return `🎯 **Equipment Borrowing:**\n\nYou can request sports equipment from the **Equipment Page**:\n• Cricket Bat, Ball\n• Football\n• Badminton Racket\n• Table Tennis Paddle\n• Carrom Coins & Board\n• And more!\n\nJust submit a request and faculty will issue the equipment to you.`;
  }

  // Greetings
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    return `👋 **Hello! Welcome to U-SPORT Assistant!**\n\nI can help you with:\n• 🏟️ View sports availability\n• 📋 Guide you through booking\n• 🎯 Equipment information\n• 🔧 Maintenance schedule\n\nWhat would you like to know?`;
  }

  // Help
  if (msg.includes('help')) {
    return `🤖 **U-SPORT Assistant Help:**\n\nYou can ask me:\n• "Show all sports"\n• "Is cricket available?"\n• "How to book a facility?"\n• "What is maintenance time?"\n• "Tell me about equipment"\n\nJust type your question!`;
  }

  return `🤔 I'm not sure about that. Try asking:\n• "Show all sports"\n• "How to book?"\n• "Is badminton available?"\n• "What is maintenance time?"\n\nOr type **help** for more options.`;
};

module.exports = chatbotService;

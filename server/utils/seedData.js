const bcrypt = require('bcryptjs');

const getHashedPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const SEED_USERS = [
  {
    _id: '66fa00000000000000000001',
    name: 'Admin System Officer',
    email: 'admin@lostlink.ai',
    password: getHashedPassword('admin123'),
    phone: '+1 555-0199',
    organization: 'Apex University Campus Safety',
    role: 'admin',
    createdAt: new Date('2026-09-20T08:00:00.000Z')
  },
  {
    _id: '66fa00000000000000000002',
    name: 'John Seera',
    email: 'john@lostlink.ai',
    password: getHashedPassword('password123'),
    phone: '+1 555-0145',
    organization: 'B.Tech Computer Science',
    role: 'user',
    createdAt: new Date('2026-09-21T09:30:00.000Z')
  },
  {
    _id: '66fa00000000000000000003',
    name: 'Sarah Connor',
    email: 'sarah@lostlink.ai',
    password: getHashedPassword('password123'),
    phone: '+1 555-0182',
    organization: 'Department of Electrical Eng',
    role: 'user',
    createdAt: new Date('2026-09-22T10:15:00.000Z')
  }
];

const SEED_ITEMS = [
  {
    _id: '66fb00000000000000000001',
    type: 'found',
    title: 'Black Leather Wallet',
    category: 'Personal Accessories',
    color: 'Black',
    description: 'Bifold black leather wallet with silver stitched edges found near college library reading aisle.',
    location: 'College Library',
    date: new Date('2026-09-28T14:30:00.000Z'),
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    reportedBy: '66fa00000000000000000001',
    createdAt: new Date('2026-09-28T15:00:00.000Z')
  },
  {
    _id: '66fb00000000000000000002',
    type: 'found',
    title: 'Blue Hydro Flask Water Bottle',
    category: 'Personal Accessories',
    color: 'Blue',
    description: 'Stainless steel blue water bottle with sports cap and minor scratch on bottom rim.',
    location: 'Block B',
    date: new Date('2026-09-27T11:20:00.000Z'),
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    reportedBy: '66fa00000000000000000003',
    createdAt: new Date('2026-09-27T12:00:00.000Z')
  },
  {
    _id: '66fb00000000000000000003',
    type: 'found',
    title: 'Black Laptop Backpack',
    category: 'Bags',
    color: 'Black',
    description: 'Black water-resistant backpack with padded laptop sleeve, found on bench in central canteen.',
    location: 'Canteen',
    date: new Date('2026-09-28T13:45:00.000Z'),
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    reportedBy: '66fa00000000000000000001',
    createdAt: new Date('2026-09-28T14:10:00.000Z')
  },
  {
    _id: '66fb00000000000000000004',
    type: 'found',
    title: 'University Student ID Card',
    category: 'Documents/IDs',
    color: 'White',
    description: 'White plastic student ID card with blue university lanyard, left on desk 14 in computer lab.',
    location: 'Computer Lab',
    date: new Date('2026-09-26T16:10:00.000Z'),
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    reportedBy: '66fa00000000000000000001',
    createdAt: new Date('2026-09-26T16:45:00.000Z')
  },
  {
    _id: '66fb00000000000000000005',
    type: 'lost',
    title: 'Apple AirPods Pro in White Case',
    category: 'Electronics',
    color: 'White',
    description: 'Wireless earbuds in silicone white case with keychain carabiner, lost around cafeteria.',
    location: 'Canteen',
    date: new Date('2026-09-29T10:00:00.000Z'),
    imageUrl: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    reportedBy: '66fa00000000000000000002',
    createdAt: new Date('2026-09-29T10:30:00.000Z')
  },
  {
    _id: '66fb00000000000000000006',
    type: 'found',
    title: 'Silver Metal Scientific Calculator',
    category: 'Electronics',
    color: 'Silver',
    description: 'Casio fx-991EX engineering calculator with name sticker on battery back panel.',
    location: 'Seminar Hall 3',
    date: new Date('2026-09-29T15:30:00.000Z'),
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    reportedBy: '66fa00000000000000000003',
    createdAt: new Date('2026-09-29T16:00:00.000Z')
  }
];

const SEED_CLAIMS = [
  {
    _id: '66fc00000000000000000001',
    itemId: '66fb00000000000000000001',
    claimantId: '66fa00000000000000000002',
    message: 'I dropped my black wallet near the library entrance on the 28th. It has my metro card and college badge inside.',
    verificationAnswer: 'Metro pass ending in 4092 and a family photo in the plastic slot.',
    status: 'pending',
    adminNotes: '',
    createdAt: new Date('2026-09-29T09:00:00.000Z')
  }
];

const SEED_CHATS = [
  {
    _id: '66fd00000000000000000001',
    userId: '66fa00000000000000000002',
    role: 'user',
    message: 'I lost my black wallet near the college library yesterday.',
    createdAt: new Date('2026-09-29T08:30:00.000Z')
  },
  {
    _id: '66fd00000000000000000002',
    userId: '66fa00000000000000000002',
    role: 'assistant',
    message: 'I extracted your item details: Black Wallet, College Library, 2026-09-28. I discovered 1 high-probability match in our database!',
    extractedData: {
      item: 'wallet',
      category: 'Personal Accessories',
      color: 'black',
      location: 'college library',
      date: '2026-09-28',
      description: 'black leather wallet'
    },
    createdAt: new Date('2026-09-29T08:30:02.000Z')
  }
];

module.exports = {
  SEED_USERS,
  SEED_ITEMS,
  SEED_CLAIMS,
  SEED_CHATS
};

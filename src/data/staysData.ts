import { Hotel, Room } from "../types";

export const INITIAL_HOTELS: Hotel[] = [
  {
    id: "hotel-1",
    name: "The Grand Atrium Oasis",
    description: "Experience absolute luxury in the heart of the business district. Featuring an exquisite glass-dome atrium, world-class restaurant dining, and direct access to the premium Lotus Spa.",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    address: "5 Lesnaya St, bld. 2 (Lotus Spa District)",
    amenities: ["WiFi", "Pool", "Spa", "Gym", "AC", "Parking", "Room Service", "Bar"]
  },
  {
    id: "hotel-2",
    name: "Alpine Summit Retreat",
    description: "A gorgeous modern mountain-inspired haven of tranquility in the metropolitan center. Ideal for active travelers and luxury fitness seekers, sharing borders with Gold Gym.",
    images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    address: "42 Mira Ave (Olympic Plaza Area)",
    amenities: ["WiFi", "Gym", "AC", "Parking", "Restaurant", "Pet-Friendly", "Bar"]
  },
  {
    id: "hotel-3",
    name: "Patriarch Boutique Residence",
    description: "An elegant historic residence featuring unmatched privacy, curated editorial design, and personalized white-glove butler service near the tranquil Patriarch's Ponds.",
    images: [
      "https://images.unsplash.com/photo-1506059612708-99d6c258160e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    address: "12 Bolshoy Kozikhinsky Ln (Ponds District)",
    amenities: ["WiFi", "AC", "Butler Service", "Terrace", "Kitchenette", "Parking"]
  }
];

export const INITIAL_ROOMS: Room[] = [
  // Rooms for Hotel 1 (Grand Atrium Oasis)
  {
    id: "room-101",
    hotelId: "hotel-1",
    type: "Deluxe Suite with Spa View",
    pricePerNight: 12500,
    capacity: 2,
    bedsCount: 1
  },
  {
    id: "room-102",
    hotelId: "hotel-1",
    type: "Presidential Glass Dome Suite",
    pricePerNight: 24000,
    capacity: 4,
    bedsCount: 2
  },
  {
    id: "room-103",
    hotelId: "hotel-1",
    type: "Executive Comfort Room",
    pricePerNight: 8500,
    capacity: 2,
    bedsCount: 1
  },

  // Rooms for Hotel 2 (Alpine Summit Retreat)
  {
    id: "room-201",
    hotelId: "hotel-2",
    type: "Panoramic Summit Room",
    pricePerNight: 9500,
    capacity: 2,
    bedsCount: 1
  },
  {
    id: "room-202",
    hotelId: "hotel-2",
    type: "Active Family Suite",
    pricePerNight: 15000,
    capacity: 5,
    bedsCount: 3
  },
  {
    id: "room-203",
    hotelId: "hotel-2",
    type: "Alpine Cozy Single",
    pricePerNight: 6200,
    capacity: 1,
    bedsCount: 1
  },

  // Rooms for Hotel 3 (Patriarch Boutique Residence)
  {
    id: "room-301",
    hotelId: "hotel-3",
    type: "Patriarch Classic Double",
    pricePerNight: 11000,
    capacity: 2,
    bedsCount: 1
  },
  {
    id: "room-302",
    hotelId: "hotel-3",
    type: "Editorial Penthouse Suite",
    pricePerNight: 22000,
    capacity: 3,
    bedsCount: 2
  },
  {
    id: "room-303",
    hotelId: "hotel-3",
    type: "Royal Garden Studio",
    pricePerNight: 16500,
    capacity: 2,
    bedsCount: 1
  }
];

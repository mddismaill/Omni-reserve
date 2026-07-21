import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Compass, MapPin, Navigation, Sparkles, Calendar, BookOpen, AlertCircle, ExternalLink, HelpCircle, RefreshCw } from 'lucide-react';
import type { Restaurant, Salon } from '../types';
import i18n from '../lib/i18n';

// Google Maps API Key handling
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Standardized physical hubs in Moscow pairing a premium restaurant and wellness service
interface HubLocation {
  id: string;
  name: string;
  restaurantId: string;
  salonId: string;
  coordinates: { lat: number; lng: number };
  addressRu: string;
  addressEn: string;
  metroDirectionsRu: string;
  metroDirectionsEn: string;
}

const HUBS: HubLocation[] = [
  {
    id: 'belorusskaya-hub',
    name: 'Belorusskaya Elite Hub',
    restaurantId: 'grand-atelier',
    salonId: 'lotus-spa',
    coordinates: { lat: 55.7794, lng: 37.5925 },
    addressRu: 'ул. Лесная, д. 5, стр. 2, Москва (Депо)',
    addressEn: '5 Lesnaya St, bld. 2, Moscow (Depo)',
    metroDirectionsRu: 'Метро Белорусская (выход 3). 5 минут пешком по ул. Лесная.',
    metroDirectionsEn: 'Belorusskaya Metro (exit 3). 5 min walk along Lesnaya St.'
  },
  {
    id: 'prospekt-mira-hub',
    name: 'Prospekt Mira Wellness Hub',
    restaurantId: 'sakura-zen',
    salonId: 'gold-gym',
    coordinates: { lat: 55.7820, lng: 37.6327 },
    addressRu: 'пр-т Мира, д. 42, Москва (Олимпик Плаза)',
    addressEn: '42 Mira Ave, Moscow (Olympic Plaza)',
    metroDirectionsRu: 'Метро Проспект Мира (радиальная), выход 1. Перейдите дорогу.',
    metroDirectionsEn: 'Prospekt Mira Metro (radial), exit 1. Cross the street.'
  },
  {
    id: 'patriarshiye-hub',
    name: 'Patriarshiye Ponds Premium Hub',
    restaurantId: 'bison-vine',
    salonId: 'prime-barber',
    coordinates: { lat: 55.7634, lng: 37.5982 },
    addressRu: 'Большой Козихинский пер., д. 12, Москва',
    addressEn: '12 Bolshoy Kozikhinsky Ln, Moscow',
    metroDirectionsRu: 'Метро Пушкинская / Маяковская. 8 минут пешком по переулкам.',
    metroDirectionsEn: 'Pushkinskaya or Mayakovskaya Metro. 8 min walk through cozy lanes.'
  }
];

interface InteractiveMapHubProps {
  setActiveModule: (module: 'dashboard' | 'tabletop' | 'bookly' | 'rbac' | 'ai-assistant') => void;
  setSelectedRestaurant: (r: Restaurant | null) => void;
  setSelectedSalon: (s: Salon | null) => void;
  restaurants: Restaurant[];
  salons: Salon[];
  theme?: 'light' | 'dark';
}

export default function InteractiveMapHub({
  setActiveModule,
  setSelectedRestaurant,
  setSelectedSalon,
  restaurants,
  salons,
  theme = 'dark'
}: InteractiveMapHubProps) {
  const [selectedHub, setSelectedHub] = useState<HubLocation>(HUBS[0]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  
  // Maps Grounding State
  const [groundingQuery, setGroundingQuery] = useState('');
  const [groundingResponse, setGroundingResponse] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [groundingLoading, setGroundingLoading] = useState(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);

  // Focus coordinates on hub change
  const [mapCenter, setMapCenter] = useState(HUBS[0].coordinates);
  const [mapZoom, setMapZoom] = useState(13);

  const handleHubSelect = (hub: HubLocation) => {
    setSelectedHub(hub);
    setMapCenter(hub.coordinates);
    setMapZoom(15);
    setActiveMarkerId(hub.id);
  };

  // Find corresponding records
  const currentRestaurant = restaurants.find(r => r.id === selectedHub.restaurantId);
  const currentSalon = salons.find(s => s.id === selectedHub.salonId);

  // Handle Quick Booking Navigation
  const handleBookTable = () => {
    if (currentRestaurant) {
      setSelectedRestaurant(currentRestaurant);
      setActiveModule('tabletop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBookService = () => {
    if (currentSalon) {
      setSelectedSalon(currentSalon);
      setActiveModule('bookly');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Maps Grounding Search
  const handleGroundingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groundingQuery.trim()) return;

    setGroundingLoading(true);
    setGroundingError(null);
    setGroundingResponse(null);
    setGroundingChunks([]);

    try {
      const response = await fetch('/api/ai/maps-grounding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: groundingQuery,
          latitude: selectedHub.coordinates.lat,
          longitude: selectedHub.coordinates.lng
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to search location data via Gemini.');
      }

      const data = await response.json();
      setGroundingResponse(data.text);
      setGroundingChunks(data.groundingChunks || []);
    } catch (err: any) {
      console.error('Error fetching Maps grounding:', err);
      setGroundingError(err.message || 'Error executing location search.');
    } finally {
      setGroundingLoading(false);
    }
  };

  if (!hasValidKey) {
    return (
      <div className="bg-[#16191F] border border-white/5 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="max-w-xl mx-auto text-center py-6 space-y-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-display font-bold text-white">Google Maps API Key Required</h3>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
            The interactive location mapping module requires a Google Maps Platform API key to load custom map centers, coordinates, and markers.
          </p>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left space-y-2 text-xs">
            <p className="font-semibold text-teal-400">To add your API key:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-white/70 font-mono text-[11px]">
              <li>
                <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                  Get a Google Maps API Key
                </a>
              </li>
              <li>Open <strong>Settings</strong> (⚙️ gear icon in top-right corner)</li>
              <li>Go to <strong>Secrets</strong> panel</li>
              <li>Add a secret with name <code className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">GOOGLE_MAPS_PLATFORM_KEY</code></li>
              <li>Paste your key and click Save. The application will rebuild automatically!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const isRu = i18n.language === 'ru';
  const isHy = i18n.language === 'hy';

  return (
    <div className="bg-[#16191F] border border-white/5 rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-6" id="google-maps-dashboard-hub">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/10">
              <Navigation className="w-4 h-4 animate-spin-slow" />
            </div>
            <h3 className="font-display font-black text-lg text-white">
              {isHy ? 'OmniHub ինտերակտիվ քարտեզ' : isRu ? 'Интерактивная карта OmniHub' : 'OmniHub Interactive Locations'}
            </h3>
          </div>
          <p className="text-white/40 text-xs mt-1">
            {isHy ? 'Ընտրեք պրեմիում համալիրը քարտեզի վրա դիտելու և ամրագրելու համար' : isRu ? 'Выберите премиальный комплекс для просмотра на карте и бронирования' : 'Select a premium location hub to explore coordinates and make instant reservations'}
          </p>
        </div>

        {/* Hub Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {HUBS.map(hub => (
            <button
              key={hub.id}
              onClick={() => handleHubSelect(hub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedHub.id === hub.id
                  ? 'bg-teal-500 border-teal-400 text-black shadow-lg shadow-teal-500/15'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {hub.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Side (Details), Right Side (Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Details & Quick Book */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Location Address & Directions Card */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="text-[10px] font-mono text-white/40 uppercase block font-bold">
                    {isHy ? 'ՀԱԲԻ ՀԱՍՑԵՆ' : isRu ? 'АДРЕС ХАБА' : 'HUB ADDRESS'}
                  </span>
                  <span className="text-xs font-bold text-white leading-tight">
                    {isHy ? (
                      selectedHub.id === 'belorusskaya-hub' ? 'Լեսնայա փողոց, 5, շին․ 2, Մոսկվա (Դեպո)' :
                      selectedHub.id === 'prospekt-mira-hub' ? 'Միրայի պողոտա, 42, Մոսկվա (Օլիմպիկ Պլազա)' :
                      'Բոլշոյ Կոզիխինսկի նրբանցք, 12, Մոսկվա'
                    ) : isRu ? selectedHub.addressRu : selectedHub.addressEn}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-white/[0.03] pt-2.5">
                <Compass className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="text-[10px] font-mono text-white/40 uppercase block font-bold">
                    {isHy ? 'ԻՆՉՊԵՍ ՀԱՍՆԵԼ ՄԵՏՐՈՅՈՎ' : isRu ? 'КАК ДОБРАТЬСЯ НА МЕТРО' : 'METRO DIRECTIONS'}
                  </span>
                  <p className="text-[11px] text-white/70 leading-normal">
                    {isHy ? (
                      selectedHub.id === 'belorusskaya-hub' ? 'Բելորուսսկայա մետրո (ելք 3): 5 րոպե քայլել Լեսնայա փողոցով:' :
                      selectedHub.id === 'prospekt-mira-hub' ? 'Պրոսպեկտ Միրա մետրո (ռադիալ), ելք 1: Անցեք ճանապարհը:' :
                      'Պուշկինսկայա / Մայակովսկայա մետրո: 8 րոպե քայլել նրբանցքներով:'
                    ) : isRu ? selectedHub.metroDirectionsRu : selectedHub.metroDirectionsEn}
                  </p>
                </div>
              </div>
            </div>

            {/* Restaurant Promo inside selected hub */}
            {currentRestaurant && (
              <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-start gap-3 text-left">
                <img
                  src={currentRestaurant.image}
                  alt={currentRestaurant.name}
                  className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 uppercase border border-orange-500/15">
                    {currentRestaurant.cuisine}
                  </span>
                  <h4 className="font-display font-bold text-sm text-white mt-1 leading-tight truncate">
                    {currentRestaurant.name}
                  </h4>
                  <p className="text-[11px] text-white/60 line-clamp-2 leading-tight mt-0.5">
                    {currentRestaurant.description}
                  </p>
                </div>
              </div>
            )}

            {/* Salon/Spa Service Promo inside selected hub */}
            {currentSalon && (
              <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl flex items-start gap-3 text-left">
                <img
                  src={currentSalon.image}
                  alt={currentSalon.name}
                  className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 uppercase border border-teal-500/15">
                    {currentSalon.category}
                  </span>
                  <h4 className="font-display font-bold text-sm text-white mt-1 leading-tight truncate">
                    {currentSalon.name}
                  </h4>
                  <p className="text-[11px] text-white/60 line-clamp-2 leading-tight mt-0.5">
                    {currentSalon.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleBookTable}
              className="px-3 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isHy ? 'Ամրագրել Սեղան' : isRu ? 'Заказать Стол' : 'Book Table'}</span>
            </button>
            <button
              onClick={handleBookService}
              className="px-3 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isHy ? 'Ամրագրել Սպա' : isRu ? 'Записать Услугу' : 'Book Wellness'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-white/5 relative h-[380px] sm:h-[450px]">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              center={mapCenter}
              zoom={mapZoom}
              gestureHandling="cooperative"
              mapId="DEMO_MAP_ID"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {HUBS.map(hub => (
                <AdvancedMarker
                  key={hub.id}
                  position={hub.coordinates}
                  onClick={() => {
                    setActiveMarkerId(hub.id);
                    setSelectedHub(hub);
                  }}
                >
                  <Pin
                    background={hub.id === selectedHub.id ? '#14f195' : '#f97316'}
                    borderColor={hub.id === selectedHub.id ? '#0d9488' : '#c2410c'}
                    glyphColor="#000"
                    glyphText={hub.id === 'belorusskaya-hub' ? '🇫🇷' : hub.id === 'prospekt-mira-hub' ? '🇯🇵' : '🥩'}
                  />
                </AdvancedMarker>
              ))}

              {activeMarkerId && (
                <InfoWindow
                  position={HUBS.find(h => h.id === activeMarkerId)?.coordinates}
                  onCloseClick={() => setActiveMarkerId(null)}
                >
                  <div className="text-black text-xs p-1 max-w-[180px] text-left">
                    <p className="font-bold text-teal-800 font-display">
                      {HUBS.find(h => h.id === activeMarkerId)?.name}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {isHy ? 'OmniReserve շքեղ գաստրոնոմիկ և սպա էկոհամակարգ' : isRu ? 'Гастрономический и спа-комплекс OmniReserve' : 'Luxury gastronomic & spa ecosystem'}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>
      </div>

      {/* AI Location Grounding Assistant (Gemini with googleMaps tool) */}
      <div className="border-t border-white/5 pt-6 space-y-4">
        <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/0 text-left p-4 rounded-xl border border-teal-500/10 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/20 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white">
                {isHy ? 'Տեղորոշման ԱԻ օգնական (Grounding)' : isRu ? 'Локационный AI-помощник (Grounding)' : 'AI Location Advisor (Maps Grounding)'}
              </h4>
              <p className="text-[11px] text-white/50">
                {isHy ? 'Օգտագործեք Gemini 3.5-ը Google Maps որոնմամբ՝ երթուղիներ կառուցելու կամ շրջակայքն ուսումնասիրելու համար:' : isRu ? 'Используйте Gemini 3.5 с поиском по Google Maps для построения маршрутов, изучения окрестностей или парковок.' : 'Query Gemini 3.5 utilizing Google Maps tools to find routes, transit links, local parks, and coordinates.'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 uppercase shrink-0 font-bold">
            Gemini 3.5 + Google Maps
          </span>
        </div>

        {/* Grounding Query Form */}
        <form onSubmit={handleGroundingSearch} className="flex gap-2">
          <input
            type="text"
            value={groundingQuery}
            onChange={(e) => setGroundingQuery(e.target.value)}
            placeholder={
              isHy
                ? `Օրինակ՝ "Ինչպե՞ս գնալ Բելորուսսկայայից մինչև Լեսնայա փողոց 5?" կամ "Որտե՞ղ կայանել Միրա պողոտա 42-ի մոտ:"` :
              isRu
                ? `Например: "Как проехать от Белорусской до ул. Лесная 5?" или "Где припарковаться у пр-та Мира 42?"`
                : `e.g. "What sights are near 12 Bolshoy Kozikhinsky?" or "Best walking route from Depo to Belorusskaya Metro"`
            }
            className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 focus:border-teal-500 rounded-xl text-xs sm:text-sm text-white placeholder-white/30 outline-none transition"
          />
          <button
            type="submit"
            disabled={groundingLoading || !groundingQuery.trim()}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shrink-0 transition"
          >
            {groundingLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>{isHy ? 'Հարցնել ԱԻ-ին' : isRu ? 'Спросить ИИ' : 'Ask AI'}</span>
          </button>
        </form>

        {/* AI Answer & Citation Links */}
        {(groundingResponse || groundingLoading || groundingError) && (
          <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-left space-y-3">
            {groundingLoading ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-white/40 font-medium">
                  {isHy ? 'Gemini-ն ուսումնասիրում է քարտեզը և կառուցում պատասխանը...' : isRu ? 'Gemini исследует карту и строит точный ответ...' : 'Gemini is querying live Maps data for real-time accuracy...'}
                </span>
              </div>
            ) : groundingError ? (
              <div className="flex items-center gap-2 text-red-400 text-xs py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{groundingError}</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Text Response */}
                <div className="text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-line prose prose-invert">
                  {groundingResponse}
                </div>

                {/* Grounding Citing Badges (Mandatory as per skill) */}
                {groundingChunks && groundingChunks.length > 0 && (
                  <div className="border-t border-white/[0.04] pt-3">
                    <span className="text-[10px] text-white/40 font-bold block uppercase tracking-wider mb-2">
                      {isHy ? 'ՎԱՎԵՐԱՑՎԱԾ GOOGLE MAPS ԱՂԲՅՈՒՐՆԵՐ' : isRu ? 'ПРОВЕРЕННЫЕ ИСТОЧНИКИ GOOGLE MAPS' : 'VERIFIED GOOGLE MAPS SOURCES'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {groundingChunks.map((chunk: any, index: number) => {
                        const title = chunk.web?.title || chunk.maps?.title || `Google Maps Source ${index + 1}`;
                        const uri = chunk.web?.uri || chunk.maps?.uri;
                        if (!uri) return null;
                        return (
                          <a
                            key={index}
                            href={uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/10 hover:border-teal-500/20 rounded-lg text-[10px] font-mono tracking-wide font-bold transition shrink-0"
                          >
                            <ExternalLink className="w-3 h-3 text-teal-400" />
                            <span>{title}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

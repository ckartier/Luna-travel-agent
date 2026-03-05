import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

// ── MASSIVE AIRPORTS DATABASE (IATA-keyed) ────────────────────────
// ALL airports keyed by IATA code for direct lookup from AviationStack
const AIRPORTS: Record<string, { iata: string; city: string; lat: number; lng: number }> = {
    // -- FRANCE --
    'CDG': { iata: 'CDG', city: 'Paris CDG', lat: 49.01, lng: 2.55 },
    'ORY': { iata: 'ORY', city: 'Paris Orly', lat: 48.73, lng: 2.37 },
    'NCE': { iata: 'NCE', city: 'Nice', lat: 43.66, lng: 7.22 },
    'LYS': { iata: 'LYS', city: 'Lyon', lat: 45.73, lng: 5.08 },
    'MRS': { iata: 'MRS', city: 'Marseille', lat: 43.44, lng: 5.21 },
    'TLS': { iata: 'TLS', city: 'Toulouse', lat: 43.63, lng: 1.37 },
    'BOD': { iata: 'BOD', city: 'Bordeaux', lat: 44.83, lng: -0.72 },
    'NTE': { iata: 'NTE', city: 'Nantes', lat: 47.15, lng: -1.61 },
    // -- UK --
    'LHR': { iata: 'LHR', city: 'London Heathrow', lat: 51.47, lng: -0.45 },
    'LGW': { iata: 'LGW', city: 'London Gatwick', lat: 51.15, lng: -0.19 },
    'STN': { iata: 'STN', city: 'London Stansted', lat: 51.89, lng: 0.26 },
    'LTN': { iata: 'LTN', city: 'London Luton', lat: 51.87, lng: -0.37 },
    'MAN': { iata: 'MAN', city: 'Manchester', lat: 53.35, lng: -2.28 },
    'EDI': { iata: 'EDI', city: 'Edinburgh', lat: 55.95, lng: -3.37 },
    // -- GERMANY --
    'FRA': { iata: 'FRA', city: 'Frankfurt', lat: 50.04, lng: 8.56 },
    'MUC': { iata: 'MUC', city: 'Munich', lat: 48.35, lng: 11.79 },
    'BER': { iata: 'BER', city: 'Berlin', lat: 52.37, lng: 13.52 },
    'HAM': { iata: 'HAM', city: 'Hambourg', lat: 53.63, lng: 9.99 },
    'DUS': { iata: 'DUS', city: 'Düsseldorf', lat: 51.29, lng: 6.77 },
    'CGN': { iata: 'CGN', city: 'Cologne', lat: 50.87, lng: 7.14 },
    'STR': { iata: 'STR', city: 'Stuttgart', lat: 48.69, lng: 9.22 },
    // -- EUROPE --
    'AMS': { iata: 'AMS', city: 'Amsterdam', lat: 52.31, lng: 4.76 },
    'MAD': { iata: 'MAD', city: 'Madrid', lat: 40.49, lng: -3.57 },
    'BCN': { iata: 'BCN', city: 'Barcelone', lat: 41.30, lng: 2.08 },
    'FCO': { iata: 'FCO', city: 'Rome', lat: 41.80, lng: 12.24 },
    'MXP': { iata: 'MXP', city: 'Milan Malpensa', lat: 45.63, lng: 8.72 },
    'LIN': { iata: 'LIN', city: 'Milan Linate', lat: 45.45, lng: 9.28 },
    'VCE': { iata: 'VCE', city: 'Venise', lat: 45.51, lng: 12.35 },
    'ZRH': { iata: 'ZRH', city: 'Zürich', lat: 47.46, lng: 8.55 },
    'GVA': { iata: 'GVA', city: 'Genève', lat: 46.24, lng: 6.11 },
    'VIE': { iata: 'VIE', city: 'Vienne', lat: 48.11, lng: 16.57 },
    'BRU': { iata: 'BRU', city: 'Bruxelles', lat: 50.90, lng: 4.48 },
    'LIS': { iata: 'LIS', city: 'Lisbonne', lat: 38.77, lng: -9.13 },
    'CPH': { iata: 'CPH', city: 'Copenhague', lat: 55.62, lng: 12.66 },
    'OSL': { iata: 'OSL', city: 'Oslo', lat: 60.20, lng: 11.10 },
    'ARN': { iata: 'ARN', city: 'Stockholm', lat: 59.65, lng: 17.94 },
    'HEL': { iata: 'HEL', city: 'Helsinki', lat: 60.32, lng: 24.96 },
    'ATH': { iata: 'ATH', city: 'Athènes', lat: 37.94, lng: 23.94 },
    'WAW': { iata: 'WAW', city: 'Varsovie', lat: 52.17, lng: 20.97 },
    'PRG': { iata: 'PRG', city: 'Prague', lat: 50.10, lng: 14.26 },
    'BUD': { iata: 'BUD', city: 'Budapest', lat: 47.44, lng: 19.26 },
    'OTP': { iata: 'OTP', city: 'Bucarest', lat: 44.57, lng: 26.09 },
    'IST': { iata: 'IST', city: 'Istanbul', lat: 41.28, lng: 28.75 },
    'SAW': { iata: 'SAW', city: 'Istanbul Sabiha', lat: 40.90, lng: 29.31 },
    'DUB': { iata: 'DUB', city: 'Dublin', lat: 53.43, lng: -6.27 },
    'PMI': { iata: 'PMI', city: 'Palma Mallorca', lat: 39.55, lng: 2.74 },
    'AGP': { iata: 'AGP', city: 'Malaga', lat: 36.67, lng: -4.50 },
    'ALC': { iata: 'ALC', city: 'Alicante', lat: 38.28, lng: -0.56 },
    'NAP': { iata: 'NAP', city: 'Naples', lat: 40.89, lng: 14.29 },
    'BGY': { iata: 'BGY', city: 'Bergamo', lat: 45.67, lng: 9.70 },
    'KRK': { iata: 'KRK', city: 'Cracovie', lat: 50.08, lng: 19.79 },
    'SOF': { iata: 'SOF', city: 'Sofia', lat: 42.70, lng: 23.41 },
    // -- USA & CANADA --
    'JFK': { iata: 'JFK', city: 'New York JFK', lat: 40.64, lng: -73.78 },
    'EWR': { iata: 'EWR', city: 'Newark', lat: 40.69, lng: -74.17 },
    'LGA': { iata: 'LGA', city: 'LaGuardia', lat: 40.78, lng: -73.87 },
    'LAX': { iata: 'LAX', city: 'Los Angeles', lat: 33.94, lng: -118.41 },
    'SFO': { iata: 'SFO', city: 'San Francisco', lat: 37.62, lng: -122.38 },
    'ORD': { iata: 'ORD', city: 'Chicago', lat: 41.98, lng: -87.91 },
    'ATL': { iata: 'ATL', city: 'Atlanta', lat: 33.64, lng: -84.43 },
    'DFW': { iata: 'DFW', city: 'Dallas', lat: 32.90, lng: -97.04 },
    'DEN': { iata: 'DEN', city: 'Denver', lat: 39.86, lng: -104.67 },
    'MIA': { iata: 'MIA', city: 'Miami', lat: 25.80, lng: -80.29 },
    'SEA': { iata: 'SEA', city: 'Seattle', lat: 47.45, lng: -122.31 },
    'BOS': { iata: 'BOS', city: 'Boston', lat: 42.36, lng: -71.01 },
    'IAD': { iata: 'IAD', city: 'Washington Dulles', lat: 38.95, lng: -77.46 },
    'DCA': { iata: 'DCA', city: 'Washington Reagan', lat: 38.85, lng: -77.04 },
    'PHX': { iata: 'PHX', city: 'Phoenix', lat: 33.44, lng: -112.01 },
    'LAS': { iata: 'LAS', city: 'Las Vegas', lat: 36.08, lng: -115.15 },
    'MSP': { iata: 'MSP', city: 'Minneapolis', lat: 44.88, lng: -93.22 },
    'DTW': { iata: 'DTW', city: 'Detroit', lat: 42.21, lng: -83.35 },
    'IAH': { iata: 'IAH', city: 'Houston', lat: 29.98, lng: -95.34 },
    'MCO': { iata: 'MCO', city: 'Orlando', lat: 28.43, lng: -81.31 },
    'CLT': { iata: 'CLT', city: 'Charlotte', lat: 35.21, lng: -80.94 },
    'PHL': { iata: 'PHL', city: 'Philadelphie', lat: 39.87, lng: -75.24 },
    'SAN': { iata: 'SAN', city: 'San Diego', lat: 32.73, lng: -117.19 },
    'SLC': { iata: 'SLC', city: 'Salt Lake City', lat: 40.79, lng: -111.98 },
    'HNL': { iata: 'HNL', city: 'Honolulu', lat: 21.32, lng: -157.92 },
    'ANC': { iata: 'ANC', city: 'Anchorage', lat: 61.17, lng: -150.00 },
    'YYZ': { iata: 'YYZ', city: 'Toronto', lat: 43.68, lng: -79.63 },
    'YVR': { iata: 'YVR', city: 'Vancouver', lat: 49.19, lng: -123.18 },
    'YUL': { iata: 'YUL', city: 'Montréal', lat: 45.47, lng: -73.74 },
    'MEX': { iata: 'MEX', city: 'Mexico City', lat: 19.44, lng: -99.07 },
    'CUN': { iata: 'CUN', city: 'Cancún', lat: 21.04, lng: -86.87 },
    'GDL': { iata: 'GDL', city: 'Guadalajara', lat: 20.52, lng: -103.31 },
    // -- ASIA --
    'HND': { iata: 'HND', city: 'Tokyo Haneda', lat: 35.55, lng: 139.78 },
    'NRT': { iata: 'NRT', city: 'Tokyo Narita', lat: 35.76, lng: 140.39 },
    'KIX': { iata: 'KIX', city: 'Osaka Kansai', lat: 34.43, lng: 135.24 },
    'FUK': { iata: 'FUK', city: 'Fukuoka', lat: 33.59, lng: 130.45 },
    'CTS': { iata: 'CTS', city: 'Sapporo', lat: 42.77, lng: 141.69 },
    'NGO': { iata: 'NGO', city: 'Nagoya', lat: 34.86, lng: 136.81 },
    'ICN': { iata: 'ICN', city: 'Séoul Incheon', lat: 37.46, lng: 126.44 },
    'GMP': { iata: 'GMP', city: 'Séoul Gimpo', lat: 37.56, lng: 126.80 },
    'PEK': { iata: 'PEK', city: 'Pékin', lat: 40.08, lng: 116.58 },
    'PVG': { iata: 'PVG', city: 'Shanghai Pudong', lat: 31.14, lng: 121.81 },
    'SHA': { iata: 'SHA', city: 'Shanghai Hongqiao', lat: 31.20, lng: 121.34 },
    'CAN': { iata: 'CAN', city: 'Guangzhou', lat: 23.39, lng: 113.30 },
    'SZX': { iata: 'SZX', city: 'Shenzhen', lat: 22.64, lng: 113.81 },
    'HKG': { iata: 'HKG', city: 'Hong Kong', lat: 22.31, lng: 113.92 },
    'TPE': { iata: 'TPE', city: 'Taipei', lat: 25.08, lng: 121.23 },
    'SIN': { iata: 'SIN', city: 'Singapour', lat: 1.36, lng: 103.99 },
    'BKK': { iata: 'BKK', city: 'Bangkok', lat: 13.69, lng: 100.75 },
    'DMK': { iata: 'DMK', city: 'Bangkok Don Mueang', lat: 13.91, lng: 100.61 },
    'KUL': { iata: 'KUL', city: 'Kuala Lumpur', lat: 2.75, lng: 101.71 },
    'CGK': { iata: 'CGK', city: 'Jakarta', lat: -6.13, lng: 106.66 },
    'DPS': { iata: 'DPS', city: 'Bali', lat: -8.75, lng: 115.17 },
    'MNL': { iata: 'MNL', city: 'Manille', lat: 14.51, lng: 121.02 },
    'DEL': { iata: 'DEL', city: 'Delhi', lat: 28.57, lng: 77.10 },
    'BOM': { iata: 'BOM', city: 'Mumbai', lat: 19.09, lng: 72.87 },
    'BLR': { iata: 'BLR', city: 'Bangalore', lat: 13.20, lng: 77.71 },
    'MAA': { iata: 'MAA', city: 'Chennai', lat: 12.99, lng: 80.17 },
    'CCU': { iata: 'CCU', city: 'Kolkata', lat: 22.65, lng: 88.45 },
    'HYD': { iata: 'HYD', city: 'Hyderabad', lat: 17.23, lng: 78.43 },
    'CMB': { iata: 'CMB', city: 'Colombo', lat: 7.18, lng: 79.88 },
    'DAC': { iata: 'DAC', city: 'Dhaka', lat: 23.84, lng: 90.40 },
    'KTM': { iata: 'KTM', city: 'Katmandou', lat: 27.70, lng: 85.36 },
    'SGN': { iata: 'SGN', city: 'Ho Chi Minh', lat: 10.82, lng: 106.65 },
    'HAN': { iata: 'HAN', city: 'Hanoï', lat: 21.22, lng: 105.81 },
    'RGN': { iata: 'RGN', city: 'Rangoun', lat: 16.91, lng: 96.13 },
    'PNH': { iata: 'PNH', city: 'Phnom Penh', lat: 11.55, lng: 104.84 },
    'REP': { iata: 'REP', city: 'Siem Reap', lat: 13.41, lng: 107.94 },
    // -- MIDDLE EAST --
    'DXB': { iata: 'DXB', city: 'Dubai', lat: 25.25, lng: 55.36 },
    'AUH': { iata: 'AUH', city: 'Abu Dhabi', lat: 24.43, lng: 54.65 },
    'DOH': { iata: 'DOH', city: 'Doha', lat: 25.26, lng: 51.57 },
    'JED': { iata: 'JED', city: 'Djeddah', lat: 21.68, lng: 39.16 },
    'RUH': { iata: 'RUH', city: 'Riyad', lat: 24.96, lng: 46.70 },
    'TLV': { iata: 'TLV', city: 'Tel Aviv', lat: 32.01, lng: 34.89 },
    'AMM': { iata: 'AMM', city: 'Amman', lat: 31.72, lng: 35.99 },
    'BAH': { iata: 'BAH', city: 'Bahreïn', lat: 26.27, lng: 50.63 },
    'MCT': { iata: 'MCT', city: 'Mascate', lat: 23.59, lng: 58.28 },
    'KWI': { iata: 'KWI', city: 'Koweït', lat: 29.23, lng: 47.97 },
    // -- AFRICA --
    'JNB': { iata: 'JNB', city: 'Johannesburg', lat: -26.14, lng: 28.25 },
    'CPT': { iata: 'CPT', city: 'Le Cap', lat: -33.96, lng: 18.60 },
    'CAI': { iata: 'CAI', city: 'Le Caire', lat: 30.12, lng: 31.41 },
    'CMN': { iata: 'CMN', city: 'Casablanca', lat: 33.37, lng: -7.59 },
    'ADD': { iata: 'ADD', city: 'Addis Ababa', lat: 8.98, lng: 38.80 },
    'NBO': { iata: 'NBO', city: 'Nairobi', lat: -1.32, lng: 36.93 },
    'LOS': { iata: 'LOS', city: 'Lagos', lat: 6.58, lng: 3.32 },
    'ABV': { iata: 'ABV', city: 'Abuja', lat: 9.01, lng: 7.26 },
    'ACC': { iata: 'ACC', city: 'Accra', lat: 5.61, lng: -0.17 },
    'DAR': { iata: 'DAR', city: 'Dar es Salaam', lat: -6.88, lng: 39.20 },
    'DSS': { iata: 'DSS', city: 'Dakar', lat: 14.74, lng: -17.49 },
    'ALG': { iata: 'ALG', city: 'Alger', lat: 36.69, lng: 3.22 },
    'TUN': { iata: 'TUN', city: 'Tunis', lat: 36.85, lng: 10.23 },
    'RAK': { iata: 'RAK', city: 'Marrakech', lat: 31.61, lng: -8.04 },
    'MRU': { iata: 'MRU', city: 'Île Maurice', lat: -20.43, lng: 57.68 },
    // -- SOUTH AMERICA --
    'GRU': { iata: 'GRU', city: 'São Paulo', lat: -23.43, lng: -46.47 },
    'GIG': { iata: 'GIG', city: 'Rio de Janeiro', lat: -22.81, lng: -43.25 },
    'EZE': { iata: 'EZE', city: 'Buenos Aires', lat: -34.82, lng: -58.54 },
    'SCL': { iata: 'SCL', city: 'Santiago', lat: -33.39, lng: -70.79 },
    'BOG': { iata: 'BOG', city: 'Bogotá', lat: 4.70, lng: -74.15 },
    'LIM': { iata: 'LIM', city: 'Lima', lat: -12.02, lng: -77.11 },
    'UIO': { iata: 'UIO', city: 'Quito', lat: -0.13, lng: -78.49 },
    'PTY': { iata: 'PTY', city: 'Panama', lat: 9.07, lng: -79.38 },
    'CCS': { iata: 'CCS', city: 'Caracas', lat: 10.60, lng: -66.99 },
    'MVD': { iata: 'MVD', city: 'Montevideo', lat: -34.84, lng: -56.03 },
    'HAV': { iata: 'HAV', city: 'La Havane', lat: 22.99, lng: -82.41 },
    'SJO': { iata: 'SJO', city: 'San José', lat: 10.00, lng: -84.21 },
    // -- OCEANIA --
    'SYD': { iata: 'SYD', city: 'Sydney', lat: -33.95, lng: 151.18 },
    'MEL': { iata: 'MEL', city: 'Melbourne', lat: -37.67, lng: 144.84 },
    'BNE': { iata: 'BNE', city: 'Brisbane', lat: -27.38, lng: 153.12 },
    'PER': { iata: 'PER', city: 'Perth', lat: -31.94, lng: 115.97 },
    'AKL': { iata: 'AKL', city: 'Auckland', lat: -37.01, lng: 174.79 },
    'WLG': { iata: 'WLG', city: 'Wellington', lat: -41.33, lng: 174.81 },
    'NAN': { iata: 'NAN', city: 'Fidji', lat: -17.76, lng: 177.44 },
    'PPT': { iata: 'PPT', city: 'Tahiti', lat: -17.56, lng: -149.61 },
    // -- CARIBBEAN --
    'SXM': { iata: 'SXM', city: 'Saint-Martin', lat: 18.04, lng: -63.11 },
    'PUJ': { iata: 'PUJ', city: 'Punta Cana', lat: 18.57, lng: -68.36 },
    'MBJ': { iata: 'MBJ', city: 'Montego Bay', lat: 18.50, lng: -77.91 },
    'NAS': { iata: 'NAS', city: 'Nassau', lat: 25.04, lng: -77.47 },
    'POS': { iata: 'POS', city: 'Port of Spain', lat: 10.60, lng: -61.34 },
    'BGI': { iata: 'BGI', city: 'Barbade', lat: 13.07, lng: -59.49 },
    'FDF': { iata: 'FDF', city: 'Fort-de-France', lat: 14.59, lng: -61.00 },
    'PTP': { iata: 'PTP', city: 'Pointe-à-Pitre', lat: 16.27, lng: -61.53 },
    // -- RUSSIA & CIS --
    'SVO': { iata: 'SVO', city: 'Moscou', lat: 55.97, lng: 37.41 },
    'LED': { iata: 'LED', city: 'Saint-Pétersbourg', lat: 59.80, lng: 30.27 },
    // -- OTHER JAPAN / ASIA CODES --
    'OKA': { iata: 'OKA', city: 'Okinawa', lat: 26.20, lng: 127.65 },
    'ITM': { iata: 'ITM', city: 'Osaka Itami', lat: 34.78, lng: 135.44 },
    'HIJ': { iata: 'HIJ', city: 'Hiroshima', lat: 34.44, lng: 132.92 },
    'SDJ': { iata: 'SDJ', city: 'Sendai', lat: 38.14, lng: 140.92 },
    'KOJ': { iata: 'KOJ', city: 'Kagoshima', lat: 31.80, lng: 130.72 },
    'TAK': { iata: 'TAK', city: 'Takamatsu', lat: 34.21, lng: 134.02 },
    'UBJ': { iata: 'UBJ', city: 'Ube', lat: 33.93, lng: 131.28 },
    'MMJ': { iata: 'MMJ', city: 'Matsumoto', lat: 36.17, lng: 137.92 },
    'KMI': { iata: 'KMI', city: 'Miyazaki', lat: 31.88, lng: 131.45 },
    'KMQ': { iata: 'KMQ', city: 'Komatsu', lat: 36.39, lng: 136.41 },
    'KCZ': { iata: 'KCZ', city: 'Kochi', lat: 33.55, lng: 133.67 },
    'AOJ': { iata: 'AOJ', city: 'Aomori', lat: 40.73, lng: 140.69 },
    'HAC': { iata: 'HAC', city: 'Hachijojima', lat: 33.12, lng: 139.79 },
    'TKN': { iata: 'TKN', city: 'Tokunoshima', lat: 27.84, lng: 128.88 },
    'ASJ': { iata: 'ASJ', city: 'Amami', lat: 28.43, lng: 129.71 },
    'ISG': { iata: 'ISG', city: 'Ishigaki', lat: 24.34, lng: 124.19 },
    'MMY': { iata: 'MMY', city: 'Miyako', lat: 24.78, lng: 125.30 },
    'AXT': { iata: 'AXT', city: 'Akita', lat: 39.62, lng: 140.22 },
    'OIT': { iata: 'OIT', city: 'Oita', lat: 33.48, lng: 131.74 },
    'NGS': { iata: 'NGS', city: 'Nagasaki', lat: 32.92, lng: 129.91 },
    'KKJ': { iata: 'KKJ', city: 'Kitakyushu', lat: 33.85, lng: 131.03 },
    // -- CHINA & TAIWAN --
    'CTU': { iata: 'CTU', city: 'Chengdu', lat: 30.58, lng: 103.95 },
    'WUH': { iata: 'WUH', city: 'Wuhan', lat: 30.78, lng: 114.21 },
    'XIY': { iata: 'XIY', city: 'Xian', lat: 34.45, lng: 108.75 },
    'CKG': { iata: 'CKG', city: 'Chongqing', lat: 29.72, lng: 106.64 },
    'HGH': { iata: 'HGH', city: 'Hangzhou', lat: 30.23, lng: 120.43 },
    'NKG': { iata: 'NKG', city: 'Nanjing', lat: 31.74, lng: 118.86 },
    'KHH': { iata: 'KHH', city: 'Kaohsiung', lat: 22.58, lng: 120.35 },
    'MFM': { iata: 'MFM', city: 'Macao', lat: 22.15, lng: 113.59 },
};

// ── AIRLINE COLORS & LOGOS ──────────────────────────────────────
const AIRLINE_COLORS: Record<string, string> = {
    'AF': '#3b82f6', 'BA': '#1e40af', 'LH': '#f59e0b', 'U2': '#f97316', 'FR': '#eab308',
    'EK': '#dc2626', 'TK': '#ef4444', 'SK': '#6366f1', 'AZ': '#22c55e', 'IB': '#dc2626',
    'KL': '#0ea5e9', 'LX': '#dc2626', 'TP': '#22c55e', 'QF': '#dc2626', 'AA': '#3b82f6',
    'UA': '#1e40af', 'DL': '#6366f1', 'NH': '#3b82f6', 'JL': '#dc2626', 'CX': '#22c55e',
    'SQ': '#f59e0b', 'ET': '#22c55e', 'SA': '#22c55e', 'LA': '#6366f1', 'AV': '#dc2626',
    'CZ': '#3b82f6', 'CA': '#dc2626', 'WN': '#f59e0b', 'AS': '#0ea5e9', 'B6': '#3b82f6',
    'AC': '#dc2626', 'QR': '#7c2d12', 'EY': '#f59e0b', 'VS': '#dc2626', 'OS': '#dc2626',
    'MS': '#3b82f6', 'AT': '#dc2626', 'W6': '#6366f1', 'PC': '#f59e0b', 'SU': '#3b82f6',
    'LO': '#1e40af', 'OK': '#0ea5e9', 'RO': '#3b82f6', 'AY': '#0ea5e9', 'BT': '#22c55e',
    'VN': '#dc2626', 'CI': '#6366f1', 'BR': '#22c55e', 'CPA': '#22c55e', 'MH': '#3b82f6',
    'GA': '#0ea5e9', 'TG': '#6366f1', 'PR': '#3b82f6', 'AI': '#dc2626', '6E': '#1e40af',
    'ZF': '#22c55e', 'NK': '#eab308', 'F9': '#22c55e', 'G4': '#f59e0b', 'WS': '#0ea5e9',
    'AM': '#dc2626', 'AR': '#3b82f6', 'CM': '#3b82f6',
    'KE': '#0ea5e9', 'OZ': '#6366f1', '7C': '#eab308', 'TW': '#dc2626', 'BC': '#f59e0b',
    'HD': '#6366f1', 'JQ': '#f97316', 'VA': '#dc2626', 'NZ': '#1e40af', 'FJ': '#22c55e',
    'EI': '#22c55e', 'LG': '#dc2626', 'SN': '#3b82f6', 'A3': '#1e40af', 'VY': '#eab308',
};

const AIRLINE_FLAGS: Record<string, string> = {
    'AF': '🇫🇷', 'BA': '🇬🇧', 'LH': '🇩🇪', 'U2': '🇬🇧', 'FR': '🇮🇪', 'EK': '🇦🇪',
    'TK': '🇹🇷', 'KL': '🇳🇱', 'LX': '🇨🇭', 'QF': '🇦🇺', 'AA': '🇺🇸', 'UA': '🇺🇸',
    'DL': '🇺🇸', 'NH': '🇯🇵', 'JL': '🇯🇵', 'CX': '🇭🇰', 'SQ': '🇸🇬', 'ET': '🇪🇹',
    'LA': '🇨🇱', 'CZ': '🇨🇳', 'CA': '🇨🇳', 'AC': '🇨🇦', 'QR': '🇶🇦', 'EY': '🇦🇪',
    'VS': '🇬🇧', 'MS': '🇪🇬', 'AT': '🇲🇦', 'IB': '🇪🇸', 'TP': '🇵🇹', 'KE': '🇰🇷',
    'OZ': '🇰🇷', 'CI': '🇹🇼', 'BR': '🇹🇼', 'VN': '🇻🇳', 'TG': '🇹🇭', 'MH': '🇲🇾',
    'GA': '🇮🇩', 'PR': '🇵🇭', 'AI': '🇮🇳', 'WN': '🇺🇸', 'B6': '🇺🇸', 'AM': '🇲🇽',
    'AR': '🇦🇷', 'AV': '🇨🇴', 'CM': '🇵🇦', 'NZ': '🇳🇿', 'FJ': '🇫🇯', 'SU': '🇷🇺',
    'LO': '🇵🇱', 'AY': '🇫🇮', 'SK': '🇩🇰', 'EI': '🇮🇪', 'SN': '🇧🇪', 'OS': '🇦🇹',
};

const AVIATIONSTACK_KEY = process.env.AVIATIONSTACK_API_KEY || '';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const flights = await fetchAviationStack();
        if (flights && flights.length > 0) {
            return NextResponse.json({ flights, live: true, source: 'AviationStack', count: flights.length, timestamp: new Date().toISOString() });
        }
        throw new Error('AviationStack returned no valid flights');
    } catch (avErr: any) {
        // silent fallback
        try {
            const flights = await fetchOpenSky();
            return NextResponse.json({ flights, live: true, source: 'OpenSky', count: flights.length, timestamp: new Date().toISOString() });
        } catch {
            return NextResponse.json({ flights: FALLBACK_FLIGHTS, live: false, source: 'Demo', fallback: true });
        }
    }
}

async function fetchAviationStack() {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_KEY}&flight_status=active&limit=100`;
    const response = await fetch(url, { next: { revalidate: 120 } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'AviationStack error');
    if (!data.data?.length) throw new Error('No flights');

    // CRITICAL: Only keep flights where BOTH airports are in our database
    const valid = data.data.filter((f: any) => {
        if (!f.live?.latitude || !f.live?.longitude || f.live.is_ground) return false;
        if (!f.departure?.iata || !f.arrival?.iata) return false;
        const dep = AIRPORTS[f.departure.iata];
        const arr = AIRPORTS[f.arrival.iata];
        if (!dep || !arr) return false; // SKIP flights with unknown airports
        if (dep.iata === arr.iata) return false; // Skip same airport
        return true;
    });

    if (valid.length === 0) throw new Error('No flights with known airports');

    // Geographic distribution
    const regions: Record<string, any[]> = { eu: [], na: [], asia: [], me: [], af: [], sa: [], oc: [], other: [] };
    for (const f of valid) {
        const { latitude: lat, longitude: lng } = f.live;
        if (lat > 35 && lat < 72 && lng > -15 && lng < 45) regions.eu.push(f);
        else if (lat > 15 && lat < 72 && lng > -140 && lng < -50) regions.na.push(f);
        else if (lat > -10 && lat < 60 && lng > 60 && lng < 150) regions.asia.push(f);
        else if (lat > 10 && lat < 45 && lng > 25 && lng < 65) regions.me.push(f);
        else if (lat > -40 && lat < 35 && lng > -20 && lng < 55) regions.af.push(f);
        else if (lat > -60 && lat < 15 && lng > -90 && lng < -30) regions.sa.push(f);
        else if (lat < 0 && lng > 100) regions.oc.push(f);
        else regions.other.push(f);
    }

    const selected: any[] = [];
    for (const bucket of Object.values(regions)) {
        selected.push(...bucket.sort(() => Math.random() - 0.5).slice(0, 5));
    }
    if (selected.length < 20) {
        selected.push(...valid.filter((f: any) => !selected.includes(f)).sort(() => Math.random() - 0.5).slice(0, 20 - selected.length));
    }

    return selected.slice(0, 30).map((f: any) => mapFlight(f));
}

function mapFlight(f: any) {
    const iata = f.airline?.iata || '';
    const dep = AIRPORTS[f.departure.iata]!;
    const arr = AIRPORTS[f.arrival.iata]!;

    return {
        id: f.flight?.iata || f.flight?.icao || `${dep.iata}-${arr.iata}-${Math.random().toString(36).slice(2, 6)}`,
        callsign: f.flight?.iata || f.flight?.icao || '',
        lat: f.live.latitude, lng: f.live.longitude,
        rotate: f.live.direction || 0,
        label: f.flight?.iata || iata || '',
        origin_country: '',
        altitude: f.live.altitude || 10000,
        velocity: f.live.speed_horizontal ? f.live.speed_horizontal / 3.6 : 250,
        airline: f.airline?.name || f.flight?.iata || 'Unknown',
        airlineLogo: AIRLINE_FLAGS[iata] || '✈️',
        flightNumber: f.flight?.iata || f.flight?.number || '',
        color: AIRLINE_COLORS[iata] || '#64748b',
        departure: { code: dep.iata, city: dep.city, lat: dep.lat, lng: dep.lng },
        arrival: { code: arr.iata, city: arr.city, lat: arr.lat, lng: arr.lng },
        depTerminal: f.departure.terminal || null,
        depGate: f.departure.gate || null,
        arrTerminal: f.arrival.terminal || null,
        arrGate: f.arrival.gate || null,
        depDelay: f.departure.delay || 0,
        arrDelay: f.arrival.delay || 0,
        scheduledDeparture: f.departure.scheduled || null,
        scheduledArrival: f.arrival.scheduled || null,
        aircraft: f.aircraft?.iata || null,
        flightStatus: f.flight_status || 'active',
        stops: 0, stopCity: null, live: true,
    };
}

// ── OPENSKY FALLBACK ──────────────────────────────────────────────
async function fetchOpenSky() {
    const response = await fetch('https://opensky-network.org/api/states/all', {
        next: { revalidate: 30 }, headers: { 'User-Agent': 'LunaTravelSaaS/2.0' },
    });
    if (!response.ok) throw new Error(`OpenSky HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.states?.length) throw new Error('No states');

    const AIRLINE_ICAO: Record<string, { name: string; iataCode: string }> = {
        'AFR': { name: 'Air France', iataCode: 'AF' }, 'BAW': { name: 'British Airways', iataCode: 'BA' },
        'DLH': { name: 'Lufthansa', iataCode: 'LH' }, 'EZY': { name: 'easyJet', iataCode: 'U2' },
        'RYR': { name: 'Ryanair', iataCode: 'FR' }, 'UAE': { name: 'Emirates', iataCode: 'EK' },
        'THY': { name: 'Turkish Airlines', iataCode: 'TK' }, 'KLM': { name: 'KLM', iataCode: 'KL' },
        'SWR': { name: 'Swiss', iataCode: 'LX' }, 'QFA': { name: 'Qantas', iataCode: 'QF' },
        'AAL': { name: 'American Airlines', iataCode: 'AA' }, 'UAL': { name: 'United', iataCode: 'UA' },
        'DAL': { name: 'Delta', iataCode: 'DL' }, 'ANA': { name: 'ANA', iataCode: 'NH' },
        'JAL': { name: 'JAL', iataCode: 'JL' }, 'SIA': { name: 'Singapore Airlines', iataCode: 'SQ' },
        'CPA': { name: 'Cathay Pacific', iataCode: 'CX' }, 'ETH': { name: 'Ethiopian', iataCode: 'ET' },
        'CSN': { name: 'China Southern', iataCode: 'CZ' }, 'CCA': { name: 'Air China', iataCode: 'CA' },
        'ACA': { name: 'Air Canada', iataCode: 'AC' }, 'QTR': { name: 'Qatar Airways', iataCode: 'QR' },
        'ETD': { name: 'Etihad', iataCode: 'EY' }, 'SWA': { name: 'Southwest', iataCode: 'WN' },
        'TAP': { name: 'TAP Portugal', iataCode: 'TP' }, 'IBE': { name: 'Iberia', iataCode: 'IB' },
        'KAL': { name: 'Korean Air', iataCode: 'KE' }, 'AAR': { name: 'Asiana', iataCode: 'OZ' },
        'EVA': { name: 'EVA Air', iataCode: 'BR' }, 'VIR': { name: 'Virgin Atlantic', iataCode: 'VS' },
    };

    const flights = data.states.filter((s: any) => s[1]?.trim() && s[5] != null && s[6] != null && (s[7] || 0) > 1000 && (s[9] || 0) > 100);

    // For OpenSky: find nearest airport for departure, estimate destination
    function nearest(lat: number, lng: number): typeof AIRPORTS[string] | null {
        let best: typeof AIRPORTS[string] | null = null;
        let minD = 400; // max ~20° distance
        for (const a of Object.values(AIRPORTS)) {
            const d = (lat - a.lat) ** 2 + (lng - a.lng) ** 2;
            if (d < minD) { minD = d; best = a; }
        }
        return best;
    }

    function estimateDest(lat: number, lng: number, heading: number, speed: number) {
        const RAD = Math.PI / 180;
        const dist = Math.max(8, (speed || 250) / 30);
        const dLat = lat + Math.cos(heading * RAD) * dist;
        const dLng = lng + Math.sin(heading * RAD) * dist;
        let best = Object.values(AIRPORTS)[0]; let minD = Infinity;
        for (const a of Object.values(AIRPORTS)) {
            const d = (dLat - a.lat) ** 2 + (dLng - a.lng) ** 2;
            if (d < minD) { minD = d; best = a; }
        }
        return best;
    }

    // Only keep flights with valid departure AND arrival
    const mapped = flights.slice(0, 200).map((s: any) => {
        const cs = s[1].trim();
        const lat = s[6], lng = s[5], heading = s[10] || 0, speed = s[9] || 250, alt = s[7] || 10000;
        const prefix = cs.substring(0, 3).toUpperCase();
        const airline = AIRLINE_ICAO[prefix];
        const dep = nearest(lat, lng);
        if (!dep) return null;
        let arr = estimateDest(lat, lng, heading, speed);
        if (dep.iata === arr.iata) {
            const others = Object.values(AIRPORTS).filter(a => (a.lat - lat) ** 2 + (a.lng - lng) ** 2 > 500);
            arr = others.sort(() => Math.random() - 0.5)[0] || arr;
        }
        if (!arr) return null;

        const iataCode = airline?.iataCode || '';
        return {
            id: s[0] || cs, callsign: cs, lat, lng, rotate: heading, label: cs,
            origin_country: s[2] || '', altitude: Math.round(alt), velocity: Math.round(speed),
            airline: airline?.name || cs, airlineLogo: AIRLINE_FLAGS[iataCode] || '✈️', flightNumber: cs,
            color: AIRLINE_COLORS[iataCode] || '#64748b',
            departure: { code: dep.iata, city: dep.city, lat: dep.lat, lng: dep.lng },
            arrival: { code: arr.iata, city: arr.city, lat: arr.lat, lng: arr.lng },
            stops: 0, stopCity: null, live: true,
        };
    }).filter(Boolean);

    return mapped.sort(() => Math.random() - 0.5).slice(0, 25);
}

// ── FALLBACK ──────────────────────────────────────────────────────
const FALLBACK_FLIGHTS = [
    { id: '1', callsign: 'AF1234', lat: 48.5, lng: 8.0, rotate: 45, label: 'AF1234', origin_country: 'France', altitude: 10500, velocity: 250, airline: 'Air France', airlineLogo: '🇫🇷', flightNumber: 'AF1234', color: '#3b82f6', departure: { code: 'CDG', city: 'Paris CDG', lat: 49.01, lng: 2.55 }, arrival: { code: 'JFK', city: 'New York JFK', lat: 40.64, lng: -73.78 }, stops: 0, stopCity: null, live: false },
    { id: '2', callsign: 'JL802', lat: 30.0, lng: 125.0, rotate: -60, label: 'JL802', origin_country: 'Japan', altitude: 11000, velocity: 270, airline: 'JAL', airlineLogo: '🇯🇵', flightNumber: 'JL802', color: '#dc2626', departure: { code: 'HND', city: 'Tokyo Haneda', lat: 35.55, lng: 139.78 }, arrival: { code: 'SIN', city: 'Singapour', lat: 1.36, lng: 103.99 }, stops: 0, stopCity: null, live: false },
    { id: '3', callsign: 'QF1', lat: -25.0, lng: 140.0, rotate: 300, label: 'QF1', origin_country: 'Australia', altitude: 12000, velocity: 280, airline: 'Qantas', airlineLogo: '🇦🇺', flightNumber: 'QF1', color: '#dc2626', departure: { code: 'SYD', city: 'Sydney', lat: -33.95, lng: 151.18 }, arrival: { code: 'LHR', city: 'London', lat: 51.47, lng: -0.45 }, stops: 1, stopCity: 'Singapour', live: false },
    { id: '4', callsign: 'AA100', lat: 50.0, lng: -35.0, rotate: 70, label: 'AA100', origin_country: 'USA', altitude: 10500, velocity: 260, airline: 'American Airlines', airlineLogo: '🇺🇸', flightNumber: 'AA100', color: '#3b82f6', departure: { code: 'JFK', city: 'New York JFK', lat: 40.64, lng: -73.78 }, arrival: { code: 'LHR', city: 'London', lat: 51.47, lng: -0.45 }, stops: 0, stopCity: null, live: false },
    { id: '5', callsign: 'ET700', lat: 20.0, lng: 45.0, rotate: 60, label: 'ET700', origin_country: 'Ethiopia', altitude: 11500, velocity: 250, airline: 'Ethiopian', airlineLogo: '🇪🇹', flightNumber: 'ET700', color: '#22c55e', departure: { code: 'ADD', city: 'Addis Ababa', lat: 8.98, lng: 38.80 }, arrival: { code: 'PEK', city: 'Pékin', lat: 40.08, lng: 116.58 }, stops: 0, stopCity: null, live: false },
    { id: '6', callsign: 'LA800', lat: -10.0, lng: -35.0, rotate: 30, label: 'LA800', origin_country: 'Brazil', altitude: 9000, velocity: 240, airline: 'LATAM', airlineLogo: '🇧🇷', flightNumber: 'LA800', color: '#6366f1', departure: { code: 'GRU', city: 'São Paulo', lat: -23.43, lng: -46.47 }, arrival: { code: 'CDG', city: 'Paris CDG', lat: 49.01, lng: 2.55 }, stops: 0, stopCity: null, live: false },
    { id: '7', callsign: 'EK001', lat: 40.0, lng: 30.0, rotate: -30, label: 'EK001', origin_country: 'UAE', altitude: 11500, velocity: 290, airline: 'Emirates', airlineLogo: '🇦🇪', flightNumber: 'EK001', color: '#dc2626', departure: { code: 'DXB', city: 'Dubai', lat: 25.25, lng: 55.36 }, arrival: { code: 'LHR', city: 'London', lat: 51.47, lng: -0.45 }, stops: 0, stopCity: null, live: false },
    { id: '8', callsign: 'DL100', lat: 55.0, lng: -20.0, rotate: 80, label: 'DL100', origin_country: 'USA', altitude: 11000, velocity: 270, airline: 'Delta', airlineLogo: '🇺🇸', flightNumber: 'DL100', color: '#6366f1', departure: { code: 'ATL', city: 'Atlanta', lat: 33.64, lng: -84.43 }, arrival: { code: 'AMS', city: 'Amsterdam', lat: 52.31, lng: 4.76 }, stops: 0, stopCity: null, live: false },
];

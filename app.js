/* ==========================================================================
   AURA & BLADE - Men's Executive Barber & Hair Salon
   Multilingual System (EN, AM, AR with RTL)
   White Theme & Multi-Step Booking Logic
   Reviews: Firebase Realtime Database (shared across all users)
   ========================================================================== */

// --- FIREBASE CONFIGURATION ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyANnZj5RVnCUJkUhvuS-Id8ImLuNr6bkNo",
  authDomain: "barbershop-90e82.firebaseapp.com",
  databaseURL: "https://barbershop-90e82-default-rtdb.firebaseio.com",
  projectId: "barbershop-90e82",
  storageBucket: "barbershop-90e82.firebasestorage.app",
  messagingSenderId: "843207575639",
  appId: "1:843207575639:web:15a66fa8c656bcc1387b12",
  measurementId: "G-TXSH5LGGXG"
};

let firebaseDb = null;
let firebaseReviewsRef = null;
let firebaseBarbersRef = null;
let firebaseGalleryRef = null;
let firebaseBookingsRef = null;
let firebaseLiveReviews = []; // Updated in real-time
let firebaseLiveBookings = []; // Updated in real-time

function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    firebaseDb = firebase.database();
    firebaseReviewsRef = firebaseDb.ref('reviews');
    firebaseBarbersRef = firebaseDb.ref('barbers');
    firebaseGalleryRef = firebaseDb.ref('gallery');
    firebaseBookingsRef = firebaseDb.ref('bookings');

    // 1. Real-time listener: reviews
    firebaseReviewsRef.orderByChild('timestamp').on('value', (snapshot) => {
      if (snapshot.exists()) {
        firebaseLiveReviews = [];
        snapshot.forEach((child) => {
          const item = child.val();
          item.firebaseKey = child.key;
          item.id = item.id || child.key;
          firebaseLiveReviews.unshift(item); // newest first
        });
        renderReviews();
        if (isAdminLoggedIn()) {
          renderAdminReviews();
          renderAdminOverview();
        }
      } else {
        // Seed initial reviews if empty
        DEFAULT_REVIEWS.forEach(r => firebaseReviewsRef.push(r));
      }
    });

    // 2. Real-time listener: barbers
    firebaseBarbersRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const list = [];
        snapshot.forEach((child) => {
          const b = child.val();
          b.firebaseKey = child.key;
          b.id = b.id || child.key;
          list.push(b);
        });
        if (list.length > 0) {
          BARBERS = list;
          renderTeam();
          if (isAdminLoggedIn()) {
            renderAdminBarbers();
            renderAdminOverview();
          }
        }
      } else {
        // Seed initial barbers if empty
        DEFAULT_BARBERS.forEach(b => firebaseBarbersRef.push(b));
      }
    });

    // 3. Real-time listener: gallery
    firebaseGalleryRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const list = [];
        snapshot.forEach((child) => {
          const g = child.val();
          g.firebaseKey = child.key;
          g.id = g.id || child.key;
          list.push(g);
        });
        if (list.length > 0) {
          GALLERY_ITEMS = list;
          renderGallery('all');
          if (isAdminLoggedIn()) {
            renderAdminGallery();
            renderAdminOverview();
          }
        }
      } else {
        // Seed initial gallery if empty
        DEFAULT_GALLERY.forEach(g => firebaseGalleryRef.push(g));
      }
    });

    // 4. Real-time listener: bookings (shared salon-wide)
    firebaseBookingsRef.orderByChild('createdAt').on('value', (snapshot) => {
      firebaseLiveBookings = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const b = child.val();
          b.firebaseKey = child.key;
          b.id = b.id || child.key;
          firebaseLiveBookings.unshift(b); // newest first
        });
      }
      if (isAdminLoggedIn()) {
        renderAdminAppointments();
        renderAdminOverview();
      }
    });
  } catch (err) {
    console.warn('Firebase unavailable, falling back to localStorage/defaults:', err);
    firebaseDb = null;
  }
}

// --- TRANSLATION DICTIONARIES ---
const TRANSLATIONS = {
  en: {
    infoHours: "Mon - Sat: 9:00 AM - 9:00 PM | Sun: 10:00 AM - 6:00 PM",
    infoAddress: "100 Grand Avenue, Executive Plaza Suite 400",
    brandSubtitle: "EXECUTIVE BARBER & SALON",
    navHome: "Home",
    navAbout: "About",
    navServices: "Services",
    navTeam: "Barbers",
    navGallery: "Gallery",
    navReviews: "Reviews",
    navContact: "Contact",
    navPasses: "My Passes",
    btnBookNow: "Book Now",
    heroSubtitle: "Bespoke Men's Grooming Sanctuary",
    heroTitle: "Precision Cuts, VIP Lounge & Mobile Concierge",
    heroDesc: "Experience executive grooming tailored to your style. Visit our luxury private suite or have our Master Barbers dispatched to your home, office, or hotel.",
    btnBookAppointment: "Book Appointment",
    btnExploreServices: "Explore Services",
    aboutTitle: "Craftsmanship & Atmosphere",
    aboutDesc1: "AURA & BLADE was founded on the principle of uncompromised gentleman's grooming. We combine timeless barbering traditions with modern styling precision in an atmosphere of refined luxury.",
    aboutDesc2: "Every session includes tailored scalp consultation, heated aromatherapy steam towels, and complimentary top-shelf single malt whiskey or double espresso.",
    perk1: "Private VIP Suites",
    perk2: "Hot Towel Steam",
    perk3: "Beverage & Coffee Bar",
    perk4: "Mobile Concierge Setup",
    servicesTitle: "Services Offered",
    servicesSubtitle: "Click 'Book This Service' to preselect and schedule",
    teamTitle: "Master Craftsmen & Stylists",
    teamSubtitle: "Directly book with your favorite specialist",
    galleryTitle: "Portfolio & Gallery",
    gallerySubtitle: "Filter by category or click to expand lightbox preview",
    catAll: "All Work",
    catFades: "Taper & Fades",
    catBeards: "Beard Sculpting",
    catCuts: "Classic Haircuts",
    catStyling: "VIP Styling",
    reviewsTitle: "Customer Reviews & Badges",
    reviewsSubtitle: "Rated 5.0 Stars on Google & Verified Clients",
    passesTitle: "My Active Booking Passes",
    passesSubtitle: "View, export, or print your upcoming sessions",
    contactTitle: "Location & Operating Hours",
    hoursHeading: "Operating Hours",
    weekdays: "Monday - Saturday:",
    sunday: "Sunday:",
    policyHeading: "Shop Policy Guidelines",
    policy1: "• Cancellations must be made at least 2 hours prior to session.",
    policy2: "• Grace period of 10 minutes for late arrivals.",
    addressHeading: "Salon Location & Phone",
    socialHeading: "Follow Us",
    wizardHeader: "Appointment Reservation",
    btnBookThis: "Book This Service",
    btnBookWithBarber: "Book with Barber",
    btnAddReview: "+ Add Review",
    reviewModalTitle: "Share Your Experience",
    reviewRatingLabel: "Your Rating",
    reviewNameLabel: "Full Name *",
    reviewServiceLabel: "Service Experienced",
    reviewTextLabel: "Review Comments *",
    btnSubmitReview: "Submit Review",
    btnCancel: "Cancel",
    mapHeading: "Interactive Map & Route Directions",
    mapSubheading: "Select starting point or use live GPS to calculate optimal travel route",
    btnGps: "Use My Location",
    labelStartingPoint: "Starting Point",
    labelMode: "Travel Mode",
    btnCalculateRoute: "Find Best Route",
    routeSummaryTitle: "Route Summary",
    turnByTurnHeader: "Turn-by-Turn Directions:",
    btnOpenNavApp: "Open in Navigation App",
    optDowntown: "🏙️ Downtown Financial Hub (2.4 mi)",
    optUptown: "🏢 Uptown Executive Plaza (4.1 mi)",
    optAirport: "✈️ Metro International Airport (12.5 mi)",
    optCentral: "🚉 Central Transit Station (1.8 mi)"
  },
  am: {
    infoHours: "ሰኞ - ቅዳሜ: 3:00 ጠዋት - 3:00 ማታ | እሑድ: 4:00 ጠዋት - 12:00 ማታ",
    infoAddress: "100 ግራንድ ኤቨኑ፣ ኤክስኪዩቲቭ ፕላዛ ሱት 400",
    brandSubtitle: "የወንዶች ፀጉር ቤት እና ሳሎን",
    navHome: "መነሻ",
    navAbout: "ስለ እኛ",
    navServices: "አገልግሎቶች",
    navTeam: "ባለሙያዎች",
    navGallery: "ጋለሪ",
    navReviews: "ግምገማዎች",
    navContact: "አድራሻ",
    navPasses: "የያዝኳቸው ቀኖች",
    btnBookNow: "አሁኑኑ ይዘዙ",
    heroSubtitle: "የላቀ የወንዶች ፀጉር እና ጺም እንክብካቤ",
    heroTitle: "ዘመናዊ የፀጉር አቆራረጥ እና ቪ.አይ.ፒ አገልግሎት",
    heroDesc: "ለእርስዎ በሚመች መልኩ የተዘጋጀ የፀጉር እና ጺም አቆራረጥ አገልግሎት። ወደ ሳሎናችን ይመጡ ወይም ባለሙያዎቻችንን ወደ ቤትዎ ወይም ቢሮዎ ይዘዙ።",
    btnBookAppointment: "ቀጠሮ ይያዙ",
    btnExploreServices: "አገልግሎቶችን ይመልከቱ",
    aboutTitle: "ሙያዊ ብቃት እና ውበት",
    aboutDesc1: "ኦራ እና ብሌድ የወንዶች ፀጉር እና ጺም እንክብካቤን በከፍተኛ ጥራት እና ዘመናዊ መንገድ ለማቅረብ የተቋቋመ ሳሎን ነው።",
    aboutDesc2: "እያንዳንዱ አገልግሎታችን የሞቀ ፎጣ፣ የጭንቅላት ማሳጅ እና ነፃ መጠጦችን ያካትታል።",
    perk1: "የግል ቪ.አይ.ፒ ክፍል",
    perk2: "የሞቀ ፎጣ እንፋሎት",
    perk3: "ነፃ ቡና እና መጠጦች",
    perk4: "ወደ ቤት የሚመጣ ባለሙያ",
    servicesTitle: "የምንሰጣቸው አገልግሎቶች",
    servicesSubtitle: "አገልግሎት መርጠው ቀጠሮ ለመያዝ 'ይህንን ይዘዙ' የሚለውን ይጫኑ",
    teamTitle: "የፀጉር ባለሙያዎቻችን",
    teamSubtitle: "ከሚወዱት ባለሙያ ጋር ቀጥታ ቀጠሮ ይያዙ",
    galleryTitle: "የስራዎቻችን ጋለሪ",
    gallerySubtitle: "ምስሎችን በትልቁ ለማየት ይጫኑ",
    catAll: "ሁሉም",
    catFades: "ፌድ እና ፌስቲቫል",
    catBeards: "ጺም ማስተካከል",
    catCuts: "ክላሲክ አቆራረጥ",
    catStyling: "ቪ.አይ.ፒ ስታይሊንግ",
    reviewsTitle: "የደንበኞቻችን አስተያየት",
    reviewsSubtitle: "በጉግል 5.0 ኮከብ የተሰጠው",
    passesTitle: "የያዝኳቸው ቀጠሮዎች",
    passesSubtitle: "የቀጠሮ መታወቂያዎን ይመልከቱ ወይም ያውርዱ",
    contactTitle: "አድራሻ እና የስራ ሰዓት",
    hoursHeading: "የስራ ሰዓት",
    weekdays: "ሰኞ - ቅዳሜ:",
    sunday: "እሑድ:",
    policyHeading: "የሳሎኑ መመሪያዎች",
    policy1: "• ቀጠሮ ለመሰረዝ ቢያንስ ከ2 ሰዓት በፊት ማሳወቅ ያስፈልጋል።",
    policy2: "• ለዘገዩ ደንበኞች የ10 ደቂቃ ትዕግስት አለ።",
    addressHeading: "የሳሎኑ አድራሻ እና ስልክ",
    socialHeading: "በማህበራዊ ሚዲያ ይከተሉን",
    wizardHeader: "ቀጠሮ መያዣ",
    btnBookThis: "ይህንን ይዘዙ",
    btnBookWithBarber: "ከባለሙያው ጋር ይዘዙ",
    btnAddReview: "+ አስተያየት ይጻፉ",
    reviewModalTitle: "አስተያየትዎን ያጋሩ",
    reviewRatingLabel: "የሰጡት ደረጃ",
    reviewNameLabel: "ሙሉ ስም *",
    reviewServiceLabel: "ያገኙት አገልግሎት",
    reviewTextLabel: "አስተያየትዎ *",
    btnSubmitReview: "አስተያየት ያስገቡ",
    btnCancel: "ሰርዝ",
    mapHeading: "የካርታ እና የመንገድ መመሪያዎች",
    mapSubheading: "የመነሻ ቦታ ይምረጡ ወይም ምርጥ መንገድ ለማግኘት ጂፒኤስ ይጠቀሙ",
    btnGps: "ያለሁበትን ቦታ ተጠቀም",
    labelStartingPoint: "የመነሻ ቦታ",
    labelMode: "የጉዞ መንገድ",
    btnCalculateRoute: "ምርጥ መንገድ ፈልግ",
    routeSummaryTitle: "የመንገዱ ማጠቃለያ",
    turnByTurnHeader: "ደረጃ በደረጃ የመንገድ መመሪያ:",
    btnOpenNavApp: "በካርታ መተግበሪያ ክፈት",
    optDowntown: "🏙️ ዳውንታውን (3.8 ኪ.ሜ)",
    optUptown: "🏢 አፕታውን ፕላዛ (6.6 ኪ.ሜ)",
    optAirport: "✈️ ኤርፖርት (20.1 ኪ.ሜ)",
    optCentral: "🚉 ሴንትራል ባቡር ጣቢያ (2.9 ኪ.ሜ)"
  },
  ar: {
    infoHours: "الإثنين - السبت: 9:00 صباحاً - 9:00 مساءً | الأحد: 10:00 صباحاً - 6:00 مساءً",
    infoAddress: "100 شارع جراند، جناح 400",
    brandSubtitle: "صالون الحلاقة والتجميل الفاخر",
    navHome: "الرئيسية",
    navAbout: "من نحن",
    navServices: "الخدمات",
    navTeam: "الحلاقون",
    navGallery: "معرض الصور",
    navReviews: "التقييمات",
    navContact: "اتصل بنا",
    navPasses: "حجوزاتي",
    btnBookNow: "احجز الآن",
    heroSubtitle: "عالم العناية الفاخرة للرجال",
    heroTitle: "قصات شعر احترافية وجناح VIP وخدمة متنقلة",
    heroDesc: "استمتع بتجربة عناية مخصصة لأسلوبك. زر جناحنا الخاص الفاخر أو اطلب حلاّقينا الماهرين إلى منزلك أو مكتبك أو فندقك.",
    btnBookAppointment: "احجز موعداً",
    btnExploreServices: "استكشف الخدمات",
    aboutTitle: "الاحترافية والأجواء الفاخرة",
    aboutDesc1: "تأسست أورا أند بليد على مبدأ تقديم أعلى مستويات العناية للرجال. نجمع بين تقاليد الحلاقة العريقة ودقة التصفيف الحديثة.",
    aboutDesc2: "تتضمن كل جلسة استشارة للعناية بفروة الرأس، مناشف ساخنة بالبخار العطري، ومشروبات مجانية فاخرة.",
    perk1: "أجنحة VIP خاصة",
    perk2: "مناشف بخار ساخنة",
    perk3: "بار مشروبات وقهوة",
    perk4: "خدمة متنقلة للمنزل",
    servicesTitle: "الخدمات المتاحة",
    servicesSubtitle: "انقر على 'احجز هذه الخدمة' للاختيار والمتابعة",
    teamTitle: "فريق الحلاقين المحترفين",
    teamSubtitle: "احجز مباشرة مع الحلاق المفضل لديك",
    galleryTitle: "معرض الأعمال",
    gallerySubtitle: "تصفح الصور حسب الفئة أو انقر للتكبير",
    catAll: "الكل",
    catFades: "التدرج والتحديد",
    catBeards: "تهذيب اللحية",
    catCuts: "قصات كلاسيكية",
    catStyling: "تصفيف VIP",
    reviewsTitle: "تقييمات العملاء",
    reviewsSubtitle: "حصلنا على تقييم 5.0 نجوم على جوجل",
    passesTitle: "تذاكر حجوزاتي النشطة",
    passesSubtitle: "عرض أو طباعة أو تصدير حجوزاتك القادمة",
    contactTitle: "الموقع وساعات العمل",
    hoursHeading: "ساعات العمل",
    weekdays: "الإثنين - السبت:",
    sunday: "الأحد:",
    policyHeading: "سياسة الصالون",
    policy1: "• يجب إلغاء الحجز قبل ساعتين على الأقل من الموعد.",
    policy2: "• فترة سماح 10 دقائق للتأخير.",
    addressHeading: "العنوان ورقم الهاتف",
    socialHeading: "تابعنا على وسائل التواصل",
    wizardHeader: "حجز موعد جديد",
    btnBookThis: "احجز هذه الخدمة",
    btnBookWithBarber: "احجز مع الحلاق",
    btnAddReview: "+ إضافة تقييم",
    reviewModalTitle: "شاركونا رأيكم",
    reviewRatingLabel: "تقييمك",
    reviewNameLabel: "الاسم الكامل *",
    reviewServiceLabel: "الخدمة التي حصلت عليها",
    reviewTextLabel: "تعليقك *",
    btnSubmitReview: "إرسال التقييم",
    btnCancel: "إلغاء",
    mapHeading: "الخريطة والتوجيهات التفاعلية",
    mapSubheading: "اختر نقطة الانطلاق أو استخدم GPS لحساب أفضل مسار",
    btnGps: "استخدم موقعي الحالي",
    labelStartingPoint: "نقطة الانطلاق",
    labelMode: "وسيلة التنقل",
    btnCalculateRoute: "احسب أفضل مسار",
    routeSummaryTitle: "ملخص المسار",
    turnByTurnHeader: "التوجيهات خطوة بخطوة:",
    btnOpenNavApp: "فتح في تطبيق الخرائط",
    optDowntown: "🏙️ وسط المدينة التجاري (3.8 كم)",
    optUptown: "🏢 مركز أبتون التنفيذي (6.6 كم)",
    optAirport: "✈️ مطار مترو الدولي (20.1 كم)",
    optCentral: "🚉 محطة النقل المركزية (2.9 كم)"
  }
};

// --- DATA CONFIGURATION ---
const SERVICES = [
  {
    id: 'std-1',
    category: 'haircuts',
    name: {
      en: 'Executive Haircut & Beard Sculpt',
      am: 'ኤክስኪዩቲቭ የፀጉር እና ጺም አቆራረጥ',
      ar: 'قص شعر تنفيذي وتشذيب اللحية'
    },
    duration: '45 mins',
    price: 75,
    description: {
      en: 'Precision cut, taper fade or classic styling, hot towel beard sculpting, and neck razor finish.',
      am: 'በከፍተኛ ጥራት የሚከናወን የፀጉር አቆራረጥ፣ የሞቀ ፎጣ እና የጺም ቅርፅ ማስተካከል።',
      ar: 'قص شعر دقيق وتدرج أو تصفيف كلاسيكي مع تشذيب اللحية بمناشف ساخنة.'
    }
  },
  {
    id: 'std-2',
    category: 'beards',
    name: {
      en: 'Classic Hot Towel Razor Shave',
      am: 'በሞቀ ፎጣ የተደገፈ የጺም ላጭ',
      ar: 'حلاقة كلاسيكية بالشفرة والمناشف الساخنة'
    },
    duration: '30 mins',
    price: 55,
    description: {
      en: 'Traditional hot towel steam, pre-shave essential oils, straight razor lather shave, and cold splash finish.',
      am: 'ባህላዊ የሞቀ ፎጣ እንፋሎት፣ ቅባቶች እና በምላጭ የሚደረግ የጺም ላጭ።',
      ar: 'بخار المناشف الساخنة التقليدية مع الزيوت العطرية وحلاقة الشفرة المستقيمة.'
    }
  },
  {
    id: 'std-3',
    category: 'color',
    name: {
      en: 'Grey Blending & Beard Coloring',
      am: 'የፀጉር እና ጺም ቀለም ቀየራ',
      ar: 'صبغة شعر ولحية طبيعية'
    },
    duration: '45 mins',
    price: 85,
    description: {
      en: 'Natural grey blending treatment for hair and beard using premium ammonia-free formulas.',
      am: 'ተፈጥሮአዊ ይዘቱን የጠበቀ የፀጉር እና የጺም ቀለም ማስተካከል አገልግሎት።',
      ar: 'معالجة طبيعية لدمج الشيب للشعر واللحية باستخدام تركيبات خالية من الأمونيا.'
    }
  },
  {
    id: 'vip-1',
    category: 'vip',
    name: {
      en: 'Royal VIP Grooming Ritual',
      am: 'ሮያል ቪ.አይ.ፒ ሙሉ እንክብካቤ',
      ar: 'طقوس العناية الملكية VIP'
    },
    duration: '90 mins',
    price: 160,
    vip: true,
    description: {
      en: 'Full haircut, beard sculpting, facial detox, hand manicure, and private suite access with beverage bar.',
      am: 'ሙሉ የፀጉር እና ጺም አቆራረጥ፣ የፊት እንክብካቤ፣ የእጅ ማኒኪዩር እና የቪ.አይ.ፒ ክፍል አገልግሎት።',
      ar: 'قص شعر كامل وتنظيف البشرة والعناية باليدين مع دخول الجناح الخاص.'
    }
  },
  {
    id: 'vip-2',
    category: 'vip',
    name: {
      en: 'Presidential Grooming & Cigar Lounge',
      am: 'ፕሬዝዳንሻል ሙሉ አገልግሎት',
      ar: 'العناية الرئاسية وجلسة الاستراحة'
    },
    duration: '120 mins',
    price: 280,
    vip: true,
    description: {
      en: 'Complete top-to-bottom grooming ritual followed by complimentary access to the private executive lounge.',
      am: 'ከላይ እስከ ታች የሚደረግ ሙሉ የቪ.አይ.ፒ እንክብካቤ እና የላውንጅ አገልግሎት።',
      ar: 'جلسة عناية شاملة من الألف إلى الياء متبوعة بدخول الاستراحة الرئاسية.'
    }
  },
  {
    id: 'out-1',
    category: 'outdoor',
    name: {
      en: 'Outdoor Concierge Barber Service',
      am: 'ወደ እርስዎ ቤት/ቢሮ የሚመጣ ባለሙያ',
      ar: 'خدمة الحلاق المتنقل للمنزل والمكتب'
    },
    duration: '60 mins',
    price: 180,
    outdoor: true,
    description: {
      en: 'Our mobile barber unit dispatched directly to your home, office, or hotel room with complete setup.',
      am: 'የፀጉር አስተካካያችን ወደ እርስዎ ቤት፣ ቢሮ ወይም ሆቴል መጥቶ የሚሰጠው አገልግሎት።',
      ar: 'وحدة الحلاقة المتنقلة تصل مباشرة إلى منزلك أو مكتبك أو غرفتك بالفندق.'
    }
  }
];

const DEFAULT_BARBERS = [
  {
    id: 'b-any',
    name: { en: 'First Available Barber', am: 'የመጀመሪያው ክፍት ባለሙያ', ar: 'أول حلاق متاح' },
    role: { en: 'Master Standard', am: 'ዋና ባለሙያ', ar: 'درجة ماستر' },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    bio: { en: 'Assigns the next available master craftsman.', am: 'ቀጥሎ ክፍት የሆነውን ባለሙያ ይመድባል።', ar: 'تعيين الحلاق المتاح التالي تلقائياً.' }
  },
  {
    id: 'b-1',
    name: { en: 'Viktor Vance', am: 'ቪክቶር ቫንስ', ar: 'فيكتور فانس' },
    role: { en: 'Senior Master Barber', am: 'ከፍተኛ የፀጉር አስተካካይ', ar: 'كبير الحلاقين المحترفين' },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    bio: { en: 'Specialist in razor fades and classic styling with 12+ years experience.', am: 'የ12 ዓመት ልምድ ያለው የፌድ እና ክላሲክ አቆራረጥ ባለሙያ።', ar: 'خبير في قصات التدرج والتصفيف الكلاسيكي بخبرة 12 عاماً.' }
  },
  {
    id: 'b-2',
    name: { en: 'Alexander Sterling', am: 'አለክሳንደር ስተርሊንግ', ar: 'ألكسندر ستيرلينج' },
    role: { en: 'VIP Suite Lead Specialist', am: 'የቪ.አይ.ፒ ክፍል ኃላፊ', ar: 'أخصائي جناح VIP' },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    bio: { en: 'Expert in facial steam treatments and royal VIP suite rituals.', am: 'የፊት እንክብካቤ እና የቪ.አይ.ፒ አገልግሎት ባለሙያ።', ar: 'خبير في جلسات البخار والعناية الفاخرة بجناح VIP.' }
  },
  {
    id: 'b-3',
    name: { en: 'Dante Rossi', am: 'ዳንቴ ሮሲ', ar: 'داني روسي' },
    role: { en: 'Outdoor Concierge Lead', am: 'የውጪ አገልግሎት መሪ', ar: 'قائد الخدمة المتنقلة' },
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    bio: { en: 'Mobile service specialist bringing precision styling directly to your residence.', am: 'አገልግሎቱን ወደ ቤትዎ እና ቢሮዎ የሚያመጣ ባለሙያ።', ar: 'متخصص الخدمة المتنقلة التي تصلك أينما كنت.' }
  }
];

const DEFAULT_GALLERY = [
  { id: 'g-1', category: 'fades', title: 'Precision Skin Fade', img: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80' },
  { id: 'g-2', category: 'beards', title: 'Beard Sculpt & Razor Edge', img: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80' },
  { id: 'g-3', category: 'haircuts', title: 'Executive Pompadour', img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
  { id: 'g-4', category: 'styling', title: 'Royal VIP Steam Treatment', img: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80' }
];

const DEFAULT_REVIEWS = [
  { name: 'Lord Marcus Vance', rating: 5, text: 'The Royal VIP Ritual is unmatched. High-end atmosphere, exceptional straight razor shave, and top-tier espresso bar.', service: 'Royal VIP Grooming Ritual', timestamp: Date.now() - 259200000 },
  { name: 'Dr. David Chen', rating: 5, text: 'Viktor is a true artist. Best taper fade I have ever had. The online booking and calendar pass makes it so smooth.', service: 'Executive Haircut & Beard Sculpt', timestamp: Date.now() - 172800000 },
  { name: 'Sami Al-Hassan', rating: 5, text: 'خدمة فاخرة جداً وحلاقة احترافية. الجناح الخاص راقي للغاية والتعامل ممتاز.', service: 'Presidential Grooming & Cigar Lounge', timestamp: Date.now() - 86400000 }
];

let BARBERS = [...DEFAULT_BARBERS];
let GALLERY_ITEMS = [...DEFAULT_GALLERY];
let REVIEWS = [...DEFAULT_REVIEWS];

const DEFAULT_SLOTS = [
  '09:00 AM', '10:15 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'
];

// --- APP STATE ---
let currentLang = 'en';
let wizardCurrentStep = 1;
let selectedService = SERVICES[0];
let selectedBarber = BARBERS[0];
let selectedDateStr = getFormattedDate(new Date());
let selectedTimeSlot = '10:15 AM';
let currentBookingReceipt = null;

const STORAGE_BOOKINGS_KEY = 'aura_blade_bookings_v4';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();   // <-- connect to Firebase & start live listener
  renderServices();
  renderTeam();
  renderGallery('all');
  renderReviews();  // initial render (shows default reviews while Firebase loads)
  renderMyBookings();
  updateI18nTexts();

  // Lazy-init the map when the contact section comes into view
  const mapEl = document.getElementById('map');
  if (mapEl) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initMap();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(mapEl);
  }

  // Check if opened with #admin hash
  if (window.location.hash === '#admin') {
    setTimeout(openAdminLogin, 350);
  }
});

// Admin shortcut & hash listener
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#admin') {
    openAdminLogin();
  }
});

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    openAdminLogin();
  }
});

// --- LANGUAGE SWITCHER ---
function changeLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  updateI18nTexts();
  renderServices();
  renderTeam();
  if (document.getElementById('bookingModal').classList.contains('active')) {
    goToWizardStep(wizardCurrentStep);
  }
  showToast(`Language set to: ${lang.toUpperCase()}`);
}

function updateI18nTexts() {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
}

// --- RENDER SERVICES ---
function renderServices() {
  const container = document.getElementById('servicesGrid');
  if (!container) return;
  container.innerHTML = '';

  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  SERVICES.forEach(s => {
    const sName = s.name[currentLang] || s.name.en;
    const sDesc = s.description[currentLang] || s.description.en;

    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
      <div>
        <h3 class="service-name">${sName}</h3>
        <div class="service-duration"><i class="fa-regular fa-clock"></i> ${s.duration}</div>
        <p class="service-desc">${sDesc}</p>
      </div>
      <div class="service-footer">
        <div class="service-price">$${s.price}</div>
        <button class="btn-primary btn-sm" onclick="openWizardWithService('${s.id}')">
          <i class="fa-solid fa-calendar-check"></i> ${dict.btnBookThis || 'Book This Service'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderTeam() {
  const container = document.getElementById('teamGrid');
  if (!container) return;
  container.innerHTML = '';

  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  BARBERS.forEach(b => {
    const bName = b.name[currentLang] || b.name.en;
    const bRole = b.role[currentLang] || b.role.en;
    const bBio = b.bio[currentLang] || b.bio.en;

    const card = document.createElement('div');
    card.className = 'barber-card';
    card.innerHTML = `
      <img src="${b.avatar}" alt="${bName}" class="barber-img">
      <h3 class="barber-name">${bName}</h3>
      <div class="barber-role">${bRole}</div>
      <p class="barber-bio">${bBio}</p>
      <button class="btn-secondary btn-sm" style="width:100%; justify-content:center;" onclick="openWizardWithBarber('${b.id}')">
        <i class="fa-solid fa-user-check"></i> ${dict.btnBookWithBarber || 'Book with Barber'}
      </button>
    `;
    container.appendChild(card);
  });
}

function renderGallery(filter = 'all') {
  const container = document.getElementById('galleryGrid');
  if (!container) return;
  container.innerHTML = '';

  const filtered = GALLERY_ITEMS.filter(g => filter === 'all' || g.category === filter);
  filtered.forEach(g => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.onclick = () => openLightbox(g.img);
    item.innerHTML = `
      <img src="${g.img}" alt="${g.title}">
      <div class="gallery-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
    `;
    container.appendChild(item);
  });
}

function filterGallery(cat, btn) {
  document.querySelectorAll('.gallery-filter button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGallery(cat);
}

function openLightbox(imgSrc) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  if (modal && img) {
    img.src = imgSrc;
    modal.classList.add('active');
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) modal.classList.remove('active');
}

function renderReviews(highlightFirst = false) {
  const container = document.getElementById('reviewsGrid');
  if (!container) return;
  container.innerHTML = '';

  // Use live Firebase reviews if connected and populated, otherwise fallback to local/defaults
  let allReviews;
  if (firebaseDb) {
    allReviews = firebaseLiveReviews.length > 0 ? firebaseLiveReviews : REVIEWS;
  } else {
    allReviews = [...getLocalStorageReviews(), ...REVIEWS];
  }

  if (allReviews.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No reviews yet. Be the first to share your experience!</p>';
    return;
  }

  allReviews.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'review-card';
    const isNew = highlightFirst && idx === 0;
    card.innerHTML = `
      <div class="review-stars">${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}</div>
      <p class="review-text">"${r.text}"</p>
      <div class="review-author">${r.name}${isNew ? '<span class="badge-new-review">NEW</span>' : ''}</div>
      ${r.service ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;"><i class="fa-solid fa-scissors" style="margin-right:0.3rem;"></i>${r.service}</div>` : ''}
    `;
    if (isNew) {
      card.style.animation = 'fadeSlideIn 0.5s ease';
      card.style.border = '2px solid #000';
    }
    container.appendChild(card);
  });
}

// --- REVIEW STORAGE (Firebase primary, localStorage fallback) ---

function getLocalStorageReviews() {
  const key = 'aura_blade_reviews_v1';
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

function saveToLocalStorage(reviews) {
  localStorage.setItem('aura_blade_reviews_v1', JSON.stringify(reviews));
}

// --- REVIEW MODAL ---
let currentReviewRating = 5;

function openReviewModal() {
  currentReviewRating = 5;
  document.getElementById('reviewModal').classList.add('active');
  updateStarPicker(5);
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('active');
  const form = document.querySelector('#reviewModal form');
  if (form) form.reset();
  updateStarPicker(5);
  currentReviewRating = 5;
}

function setReviewRating(rating) {
  currentReviewRating = rating;
  updateStarPicker(rating);
}

function updateStarPicker(rating) {
  const stars = document.querySelectorAll('#starPicker i');
  stars.forEach((star, i) => {
    star.classList.toggle('active', i < rating);
  });
}

async function submitReview(e) {
  e.preventDefault();
  const name = document.getElementById('reviewName').value.trim();
  const service = document.getElementById('reviewService').value;
  const text = document.getElementById('reviewText').value.trim();

  if (!name || !text) return;

  const newReview = { name, rating: currentReviewRating, text, service, timestamp: Date.now() };

  if (firebaseDb && firebaseReviewsRef) {
    // Push to Firebase — the real-time listener will update ALL users automatically
    try {
      await firebaseReviewsRef.push(newReview);
    } catch (err) {
      console.warn('Firebase write failed, saving locally:', err);
      const local = getLocalStorageReviews();
      local.unshift(newReview);
      saveToLocalStorage(local);
      renderReviews(true);
    }
  } else {
    // Firebase not available — fallback to localStorage
    const local = getLocalStorageReviews();
    local.unshift(newReview);
    saveToLocalStorage(local);
    renderReviews(true);
  }

  closeReviewModal();

  // Scroll smoothly to the reviews section
  setTimeout(() => {
    const reviewsSection = document.getElementById('reviews');
    if (reviewsSection) reviewsSection.scrollIntoView({ behavior: 'smooth' });
  }, 100);

  showToast('⭐ Your review has been shared with everyone! Thank you.');
}

// --- INTERACTIVE MAP & ROUTE SYSTEM ---
let leafletMap = null;
let routePolyline = null;
let userMarker = null;
let currentTravelMode = 'driving';
let userGpsCoords = null;

// Salon coordinates (100 Grand Ave, New York)
const SALON_LAT = 40.7580;
const SALON_LNG = -73.9855;

// Preset origin coordinates
const ORIGINS = {
  downtown:  { lat: 40.7127, lng: -74.0059, label: 'Downtown Financial Hub' },
  uptown:    { lat: 40.7831, lng: -73.9712, label: 'Uptown Executive Plaza' },
  airport:   { lat: 40.6413, lng: -73.7781, label: 'Metro International Airport' },
  central:   { lat: 40.7506, lng: -73.9971, label: 'Central Transit Station' }
};

// Travel mode info multipliers for ETA estimation
const MODE_CONFIG = {
  driving:  { speed: 28, icon: 'fa-car',           color: '#000000', label: 'Driving',  unit: 'mph' },
  transit:  { speed: 20, icon: 'fa-bus',           color: '#1E40AF', label: 'Transit',  unit: 'mph' },
  biking:   { speed: 12, icon: 'fa-bicycle',       color: '#065F46', label: 'Biking',   unit: 'mph' },
  walking:  { speed: 3,  icon: 'fa-person-walking', color: '#7C3AED', label: 'Walking',  unit: 'mph' }
};

// Preset turn-by-turn directions per origin
const DIRECTIONS_DB = {
  downtown: [
    { icon: 'fa-location-arrow', text: 'Head north on Broadway' },
    { icon: 'fa-turn-right', text: 'Turn right onto W 42nd St' },
    { icon: 'fa-turn-left', text: 'Turn left on 6th Ave' },
    { icon: 'fa-turn-right', text: 'Turn right onto W 47th St' },
    { icon: 'fa-turn-right', text: 'Turn right onto Grand Ave' },
    { icon: 'fa-flag-checkered', text: 'Arrive at AURA & BLADE — Executive Plaza, Suite 400' }
  ],
  uptown: [
    { icon: 'fa-location-arrow', text: 'Head south on Amsterdam Ave' },
    { icon: 'fa-turn-right', text: 'Turn right onto W 72nd St' },
    { icon: 'fa-turn-left', text: 'Turn left onto Central Park West' },
    { icon: 'fa-turn-right', text: 'Turn right onto W 57th St' },
    { icon: 'fa-turn-right', text: 'Turn right onto Grand Ave' },
    { icon: 'fa-flag-checkered', text: 'Arrive at AURA & BLADE — Executive Plaza, Suite 400' }
  ],
  airport: [
    { icon: 'fa-location-arrow', text: 'Exit airport via Federal Circle' },
    { icon: 'fa-road', text: 'Merge onto Van Wyck Expy N (I-678)' },
    { icon: 'fa-road', text: 'Continue onto Queens-Midtown Tunnel' },
    { icon: 'fa-turn-right', text: 'Turn right onto E 42nd St' },
    { icon: 'fa-turn-right', text: 'Turn right onto Grand Ave' },
    { icon: 'fa-flag-checkered', text: 'Arrive at AURA & BLADE — Executive Plaza, Suite 400' }
  ],
  central: [
    { icon: 'fa-location-arrow', text: 'Exit Central Station via Lexington Ave' },
    { icon: 'fa-turn-right', text: 'Turn right onto E 42nd St' },
    { icon: 'fa-turn-left', text: 'Turn left onto 5th Ave' },
    { icon: 'fa-turn-right', text: 'Turn right onto W 47th St' },
    { icon: 'fa-turn-right', text: 'Turn right onto Grand Ave' },
    { icon: 'fa-flag-checkered', text: 'Arrive at AURA & BLADE — Executive Plaza, Suite 400' }
  ],
  gps: [
    { icon: 'fa-location-crosshairs', text: 'Starting from your current GPS location' },
    { icon: 'fa-road', text: 'Head toward the nearest main road' },
    { icon: 'fa-turn-right', text: 'Follow route to Grand Ave' },
    { icon: 'fa-flag-checkered', text: 'Arrive at AURA & BLADE — Executive Plaza, Suite 400' }
  ]
};

function initMap() {
  if (leafletMap) return; // Already initialized

  leafletMap = L.map('map', { zoomControl: true, scrollWheelZoom: false }).setView([SALON_LAT, SALON_LNG], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(leafletMap);

  // Custom salon pin
  const salonIcon = L.divIcon({
    html: `<div style="background:#000;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:2px solid #fff;">✂️</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    className: ''
  });

  L.marker([SALON_LAT, SALON_LNG], { icon: salonIcon })
    .addTo(leafletMap)
    .bindPopup(`
      <div style="font-family:'Outfit',sans-serif;min-width:160px;padding:4px 0;">
        <div style="font-weight:800;font-size:1rem;margin-bottom:4px;">✂️ AURA & BLADE</div>
        <div style="font-size:0.8rem;opacity:0.85;">100 Grand Avenue, Suite 400</div>
        <div style="font-size:0.75rem;opacity:0.7;margin-top:4px;">⭐⭐⭐⭐⭐ 5.0 Google Rating</div>
      </div>
    `, { maxWidth: 200 })
    .openPopup();

  // Draw initial route for downtown
  calculateBestRoute();
}

function setTravelMode(mode) {
  currentTravelMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
  });
  calculateBestRoute();
}

function calculateBestRoute() {
  if (!leafletMap) {
    initMap();
    return;
  }

  const originKey = document.getElementById('routeOrigin')?.value || 'downtown';
  let originCoords = ORIGINS[originKey];

  // If GPS selected but no coords yet
  if (originKey === 'gps') {
    if (!userGpsCoords) {
      useCurrentLocation();
      return;
    }
    originCoords = userGpsCoords;
  }

  // Remove old route polyline
  if (routePolyline) {
    leafletMap.removeLayer(routePolyline);
  }

  // Remove old user marker
  if (userMarker) {
    leafletMap.removeLayer(userMarker);
  }

  const modeConf = MODE_CONFIG[currentTravelMode];

  // Build waypoints — straight line with slight arc for visual effect
  const midLat = (originCoords.lat + SALON_LAT) / 2 + 0.008;
  const midLng = (originCoords.lng + SALON_LNG) / 2 + 0.004;
  const latlngs = [
    [originCoords.lat, originCoords.lng],
    [midLat, midLng],
    [SALON_LAT, SALON_LNG]
  ];

  routePolyline = L.polyline(latlngs, {
    color: modeConf.color,
    weight: 5,
    opacity: 0.85,
    dashArray: currentTravelMode === 'walking' ? '8, 10' : currentTravelMode === 'biking' ? '4, 6' : null,
    lineJoin: 'round'
  }).addTo(leafletMap);

  // Origin pin
  const originIcon = L.divIcon({
    html: `<div style="background:${modeConf.color};color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #fff;"><i class='fa-solid ${modeConf.icon}'></i></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    className: ''
  });

  userMarker = L.marker([originCoords.lat, originCoords.lng], { icon: originIcon })
    .addTo(leafletMap)
    .bindPopup(`<div style="font-family:'Outfit',sans-serif;font-weight:600;font-size:0.85rem;">${originCoords.label || 'Your Location'}</div>`);

  // Fit map to show both points
  leafletMap.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });

  // Calculate distance (Haversine)
  const distKm = haversineKm(originCoords.lat, originCoords.lng, SALON_LAT, SALON_LNG);
  const distMi = (distKm * 0.621371).toFixed(1);
  const distKmRound = distKm.toFixed(1);
  const etaMinutes = Math.round((distKm / modeConf.speed) * 60);

  // Update route info panel
  const timeBadge = document.getElementById('routeTimeBadge');
  const distBadge = document.getElementById('routeDistanceBadge');
  if (timeBadge) timeBadge.textContent = etaMinutes < 60 ? `${etaMinutes} mins` : `${Math.floor(etaMinutes/60)}h ${etaMinutes%60}m`;
  if (distBadge) {
    const trafficLabel = currentTravelMode === 'driving' ? (distKm < 5 ? '• Low Traffic 🟢' : distKm < 15 ? '• Moderate Traffic 🟡' : '• Heavy Traffic 🔴') : '';
    distBadge.textContent = `${distMi} mi (${distKmRound} km) via Grand Ave ${trafficLabel}`;
  }

  // Update turn list
  const turnList = document.getElementById('turnList');
  if (turnList) {
    const steps = DIRECTIONS_DB[originKey] || DIRECTIONS_DB.downtown;
    turnList.innerHTML = steps.map(step => `
      <li class="turn-item">
        <i class="fa-solid ${step.icon}" style="min-width:14px;"></i>
        <span>${step.text}</span>
      </li>
    `).join('');
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    showToast('❌ Geolocation not supported by this browser.');
    return;
  }

  showToast('📍 Locating your position...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      userGpsCoords = { lat: latitude, lng: longitude, label: 'My Current Location' };

      // Update the dropdown to select GPS option
      const select = document.getElementById('routeOrigin');
      if (select) select.value = 'gps';

      if (!leafletMap) initMap();
      calculateBestRoute();
      showToast('✅ Location found! Route calculated.');
    },
    () => {
      showToast('❌ Could not access location. Please allow location access.');
    }
  );
}

function openExternalMaps() {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${SALON_LAT},${SALON_LNG}&travelmode=${currentTravelMode === 'biking' ? 'bicycling' : currentTravelMode === 'transit' ? 'transit' : currentTravelMode === 'walking' ? 'walking' : 'driving'}`;
  window.open(mapsUrl, '_blank');
}

// --- DIRECT BOOKING WIZARD HANDLERS ---
function openBookingWizard() {
  document.getElementById('bookingModal').classList.add('active');
  goToWizardStep(1);
}

function openWizardStep(step) {
  openBookingWizard();
  goToWizardStep(step);
}

function closeBookingWizard() {
  document.getElementById('bookingModal').classList.remove('active');
}

function openWizardWithService(serviceId) {
  selectedService = SERVICES.find(s => s.id === serviceId) || SERVICES[0];
  openBookingWizard();
  goToWizardStep(2); // Jump directly to Barber selection
}

function openWizardWithBarber(barberId) {
  selectedBarber = BARBERS.find(b => b.id === barberId) || BARBERS[0];
  openBookingWizard();
  goToWizardStep(3); // Jump directly to Date & Time selection
}

// --- 6-STEP BOOKING WIZARD CONTROL ---
function goToWizardStep(step) {
  wizardCurrentStep = step;

  // Update Stepper Visual Nodes
  for (let i = 1; i <= 6; i++) {
    const node = document.getElementById(`stepNode${i}`);
    if (node) {
      node.classList.remove('active', 'completed');
      if (i < step) node.classList.add('completed');
      else if (i === step) node.classList.add('active');
    }
  }

  const content = document.getElementById('wizardStepContent');
  if (!content) return;

  if (step === 1) renderStep1(content);
  else if (step === 2) renderStep2(content);
  else if (step === 3) renderStep3(content);
  else if (step === 4) renderStep4(content);
  else if (step === 5) renderStep5(content);
  else if (step === 6) renderStep6(content);
}

// Step 1: Service Selection
function renderStep1(container) {
  container.innerHTML = `
    <h3 style="color:#000; margin-bottom:0.5rem;"><i class="fa-solid fa-scissors"></i> Step 1: Select Service Ritual</h3>
    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Choose your preferred service package</p>

    <div style="display:flex; flex-direction:column; gap:1rem; margin-bottom:2rem;">
      ${SERVICES.map(s => {
        const sName = s.name[currentLang] || s.name.en;
        const sDesc = s.description[currentLang] || s.description.en;
        const isSel = selectedService.id === s.id;
        return `
          <div onclick="selectedService=SERVICES.find(item=>item.id==='${s.id}'); renderStep1(document.getElementById('wizardStepContent'))" style="background:${isSel ? '#F8F9FA' : '#FFF'}; border:2px solid ${isSel ? '#000' : 'var(--border-black)'}; border-radius:var(--radius-md); padding:1rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="color:#000; font-weight:bold;">${sName}</h4>
              <div style="font-size:0.8rem; color:var(--text-muted);">${s.duration} • ${sDesc}</div>
            </div>
            <div style="font-size:1.2rem; font-weight:900; color:#000;">$${s.price}</div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="display:flex; justify-content:flex-end;">
      <button class="btn-primary" onclick="goToWizardStep(2)">
        Next: Select Barber <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  `;
}

// Step 2: Barber Selection
function renderStep2(container) {
  const sName = selectedService.name[currentLang] || selectedService.name.en;

  container.innerHTML = `
    <h3 style="color:#000; margin-bottom:0.5rem;"><i class="fa-solid fa-user-tie"></i> Step 2: Select Master Barber</h3>
    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Service: <strong>${sName} ($${selectedService.price})</strong></p>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:2rem;">
      ${BARBERS.map(b => {
        const bName = b.name[currentLang] || b.name.en;
        const bRole = b.role[currentLang] || b.role.en;
        const isSel = selectedBarber.id === b.id;
        return `
          <div onclick="selectedBarber=BARBERS.find(item=>item.id==='${b.id}'); renderStep2(document.getElementById('wizardStepContent'))" style="background:${isSel ? '#F8F9FA' : '#FFF'}; border:2px solid ${isSel ? '#000' : 'var(--border-black)'}; border-radius:var(--radius-md); padding:1rem; cursor:pointer; text-align:center;">
            <img src="${b.avatar}" style="width:60px; height:60px; border-radius:50%; margin-bottom:0.5rem; object-fit:cover; border:2px solid #000;">
            <h4 style="color:#000; font-size:1rem; font-weight:bold;">${bName}</h4>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${bRole}</div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="display:flex; justify-content:space-between;">
      <button class="btn-secondary" onclick="goToWizardStep(1)"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <button class="btn-primary" onclick="goToWizardStep(3)">Next: Date & Time <i class="fa-solid fa-arrow-right"></i></button>
    </div>
  `;
}

// Step 3: Date & Time Selection
function renderStep3(container) {
  const bName = selectedBarber.name[currentLang] || selectedBarber.name.en;

  container.innerHTML = `
    <h3 style="color:#000; margin-bottom:0.5rem;"><i class="fa-solid fa-calendar-days"></i> Step 3: Select Date & Time</h3>
    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Barber: <strong>${bName}</strong></p>

    <div style="margin-bottom:1.5rem;">
      <label style="display:block; font-size:0.85rem; color:#000; font-weight:bold; margin-bottom:0.5rem;">Appointment Date:</label>
      <input type="date" id="wizardDateInput" value="${selectedDateStr}" onchange="selectedDateStr=this.value" style="width:100%; background:#FFF; color:#000; border:1px solid var(--border-black); border-radius:var(--radius-sm); padding:0.75rem; font-weight:bold;">
    </div>

    <div style="margin-bottom:2rem;">
      <label style="display:block; font-size:0.85rem; color:#000; font-weight:bold; margin-bottom:0.5rem;">Available Time Slots:</label>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:0.75rem;">
        ${DEFAULT_SLOTS.map(t => `
          <button onclick="selectedTimeSlot='${t}'; renderStep3(document.getElementById('wizardStepContent'))" style="background:${selectedTimeSlot === t ? '#000' : '#FFF'}; color:${selectedTimeSlot === t ? '#FFF' : '#000'}; border:1px solid #000; border-radius:var(--radius-sm); padding:0.6rem; font-weight:bold; cursor:pointer;">
            ${t}
          </button>
        `).join('')}
      </div>
    </div>

    <div style="display:flex; justify-content:space-between;">
      <button class="btn-secondary" onclick="goToWizardStep(2)"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <button class="btn-primary" onclick="goToWizardStep(4)">Next: Guest Details <i class="fa-solid fa-arrow-right"></i></button>
    </div>
  `;
}

// Step 4: Contact Details & Beverage Option
function renderStep4(container) {
  container.innerHTML = `
    <h3 style="color:#000; margin-bottom:0.5rem;"><i class="fa-solid fa-user-pen"></i> Step 4: Guest Contact Information</h3>
    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Provide your details for pass generation</p>

    <form onsubmit="event.preventDefault(); goToWizardStep(5);">
      <div style="margin-bottom:1rem;">
        <label style="display:block; font-size:0.8rem; color:#000; font-weight:bold; margin-bottom:0.3rem;">Full Name *</label>
        <input type="text" id="custNameInput" required placeholder="e.g. Marcus Vance" style="width:100%; background:#FFF; color:#000; border:1px solid var(--border-black); padding:0.75rem; border-radius:var(--radius-sm);">
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
        <div>
          <label style="display:block; font-size:0.8rem; color:#000; font-weight:bold; margin-bottom:0.3rem;">Phone Number *</label>
          <input type="tel" id="custPhoneInput" required placeholder="+1 (555) 234-5678" style="width:100%; background:#FFF; color:#000; border:1px solid var(--border-black); padding:0.75rem; border-radius:var(--radius-sm);">
        </div>
        <div>
          <label style="display:block; font-size:0.8rem; color:#000; font-weight:bold; margin-bottom:0.3rem;">Email Address *</label>
          <input type="email" id="custEmailInput" required placeholder="marcus@vance.com" style="width:100%; background:#FFF; color:#000; border:1px solid var(--border-black); padding:0.75rem; border-radius:var(--radius-sm);">
        </div>
      </div>

      <div style="margin-bottom:1.5rem;">
        <label style="display:block; font-size:0.8rem; color:#000; font-weight:bold; margin-bottom:0.3rem;">Complimentary VIP Beverage Perk</label>
        <select id="custBeverageInput" style="width:100%; background:#FFF; color:#000; border:1px solid var(--border-black); padding:0.75rem; border-radius:var(--radius-sm);">
          <option value="Macallan 12 Single Malt Whisky">Macallan 12 Single Malt Whisky</option>
          <option value="Double Espresso & Dark Chocolate">Double Espresso & Dark Chocolate</option>
          <option value="Sparkling Mineral Water">Sparkling Mineral Water</option>
        </select>
      </div>

      <div style="display:flex; justify-content:space-between;">
        <button type="button" class="btn-secondary" onclick="goToWizardStep(3)"><i class="fa-solid fa-arrow-left"></i> Back</button>
        <button type="submit" class="btn-primary">Next: Review Summary <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </form>
  `;
}

// Step 5: Summary Review
function renderStep5(container) {
  const name = document.getElementById('custNameInput')?.value || 'Guest';
  const phone = document.getElementById('custPhoneInput')?.value || '';
  const email = document.getElementById('custEmailInput')?.value || '';
  const beverage = document.getElementById('custBeverageInput')?.value || 'N/A';

  const sName = selectedService.name[currentLang] || selectedService.name.en;
  const bName = selectedBarber.name[currentLang] || selectedBarber.name.en;

  container.innerHTML = `
    <h3 style="color:#000; margin-bottom:0.5rem;"><i class="fa-solid fa-file-invoice"></i> Step 5: Reservation Summary</h3>
    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Review your details before confirming</p>

    <div style="background:#F8F9FA; border:1px solid #000; border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.5rem; display:flex; flex-direction:column; gap:0.75rem; font-size:0.95rem;">
      <div style="display:flex; justify-content:space-between;"><span>Guest Name:</span> <strong>${name}</strong></div>
      <div style="display:flex; justify-content:space-between;"><span>Service:</span> <strong>${sName}</strong></div>
      <div style="display:flex; justify-content:space-between;"><span>Barber:</span> <strong>${bName}</strong></div>
      <div style="display:flex; justify-content:space-between;"><span>Date & Time:</span> <strong>${formatDateDisplay(selectedDateStr)} @ ${selectedTimeSlot}</strong></div>
      <div style="display:flex; justify-content:space-between;"><span>VIP Perk:</span> <strong>${beverage}</strong></div>
      <div style="border-top:1px dashed #000; margin-top:0.5rem; padding-top:0.5rem; display:flex; justify-content:space-between; font-size:1.2rem; font-weight:bold;">
        <span>Total Price:</span> <span>$${selectedService.price}.00</span>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between;">
      <button class="btn-secondary" onclick="goToWizardStep(4)"><i class="fa-solid fa-arrow-left"></i> Edit Details</button>
      <button class="btn-primary" onclick="confirmFinalBooking('${name}', '${phone}', '${email}', '${beverage}')">
        <i class="fa-solid fa-lock"></i> Confirm & Generate Pass
      </button>
    </div>
  `;
}

// Finalize Booking & Generate Step 6
function confirmFinalBooking(name, phone, email, beverage) {
  const bookingId = 'AB-' + Math.floor(1000 + Math.random() * 9000);
  const sName = selectedService.name[currentLang] || selectedService.name.en;
  const bName = selectedBarber.name[currentLang] || selectedBarber.name.en;

  const booking = {
    id: bookingId,
    serviceName: sName,
    barberName: bName,
    date: selectedDateStr,
    time: selectedTimeSlot,
    custName: name,
    custPhone: phone,
    custEmail: email,
    beverage: beverage,
    price: selectedService.price,
    status: 'CONFIRMED',
    createdAt: Date.now()
  };

  if (firebaseDb && firebaseBookingsRef) {
    try {
      const newRef = firebaseBookingsRef.push(booking);
      booking.firebaseKey = newRef.key;
    } catch (err) {
      console.warn('Firebase booking push failed:', err);
    }
  }

  const bookings = getBookings();
  bookings.unshift(booking);
  saveBookings(bookings);

  currentBookingReceipt = booking;
  renderMyBookings();
  goToWizardStep(6);
}

// Step 6: Success Screen
function renderStep6(container) {
  const b = currentBookingReceipt || { id: 'AB-9012', custName: 'Guest', serviceName: selectedService.name.en, barberName: selectedBarber.name.en, date: selectedDateStr, time: selectedTimeSlot, price: selectedService.price };
  const googleCalUrl = createGoogleCalendarUrl(b);

  container.innerHTML = `
    <div style="text-align:center; padding:1rem 0;">
      <i class="fa-solid fa-circle-check" style="font-size:3.5rem; color:#000; margin-bottom:1rem;"></i>
      <h2 style="color:#000; font-size:1.8rem; margin-bottom:0.5rem;">Reservation Confirmed!</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">Pass Reference ID: <strong style="color:#000;">${b.id}</strong></p>

      <div style="background:#F8F9FA; color:#000; border:2px solid #000; border-radius:var(--radius-md); padding:1.5rem; font-family:monospace; margin-bottom:1.5rem; text-align:left;">
        <div style="text-align:center; font-weight:bold; font-size:1.1rem; border-bottom:1px dashed #000; padding-bottom:0.5rem; margin-bottom:0.75rem;">
          AURA & BLADE VIP PASS
        </div>
        <div>GUEST: ${b.custName}</div>
        <div>SERVICE: ${b.serviceName}</div>
        <div>BARBER: ${b.barberName}</div>
        <div>DATE/TIME: ${formatDateDisplay(b.date)} @ ${b.time}</div>
        <div style="border-top:1px dashed #000; margin-top:0.75rem; padding-top:0.5rem; font-weight:bold; display:flex; justify-content:space-between;">
          <span>TOTAL PAID:</span> <span>$${b.price}.00</span>
        </div>
      </div>

      <div style="display:flex; gap:0.75rem; flex-wrap:wrap; justify-content:center;">
        <a href="${googleCalUrl}" target="_blank" class="btn-primary btn-sm">
          <i class="fa-brands fa-google"></i> Add to Google Calendar
        </a>
        <button class="btn-secondary btn-sm" onclick="downloadICSFile()">
          <i class="fa-solid fa-calendar-arrow-down"></i> Download iCal Pass
        </button>
        <button class="btn-secondary btn-sm" onclick="window.print()">
          <i class="fa-solid fa-print"></i> Print Receipt
        </button>
      </div>

      <div style="margin-top:1.5rem;">
        <button class="btn-secondary" onclick="closeBookingWizard()">Close & View My Passes</button>
      </div>
    </div>
  `;
}

// --- UTILS & CALENDAR GENERATOR ---
function createGoogleCalendarUrl(b) {
  const title = encodeURIComponent(`Aura & Blade: ${b.serviceName}`);
  const details = encodeURIComponent(`Master Barber: ${b.barberName}. Guest: ${b.custName}`);
  const location = encodeURIComponent(`100 Grand Avenue, Executive Plaza Suite 400`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
}

function downloadICSFile() {
  if (!currentBookingReceipt) return;
  const b = currentBookingReceipt;
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${b.id}@aurablade.com
SUMMARY:Aura & Blade - ${b.serviceName}
DESCRIPTION:Barber Session with ${b.barberName}
LOCATION:100 Grand Avenue, Suite 400
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Aura_Blade_Pass_${b.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getFormattedDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return 'Select Date';
  const parts = dateStr.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getBookings() {
  const data = localStorage.getItem(STORAGE_BOOKINGS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
}

function renderMyBookings() {
  const container = document.getElementById('myBookingsGrid');
  const badge = document.getElementById('navBookingCount');
  const bookings = getBookings();

  if (badge) badge.textContent = bookings.length;
  if (!container) return;

  if (bookings.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No active booking passes yet. Click 'Book Now' above to create a session.</div>`;
    return;
  }

  container.innerHTML = '';
  bookings.forEach(b => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
      <div>
        <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace; margin-bottom:0.3rem;">${b.id}</div>
        <h3 class="service-name">${b.serviceName}</h3>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <i class="fa-solid fa-user-tie"></i> ${b.barberName}<br>
          <i class="fa-solid fa-calendar"></i> ${formatDateDisplay(b.date)} @ ${b.time}
        </div>
      </div>
      <div class="service-footer">
        <div class="service-price">$${b.price}</div>
        <button class="btn-secondary btn-sm" onclick="cancelPass('${b.id}')">Cancel</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function cancelPass(id) {
  let bookings = getBookings();
  bookings = bookings.filter(b => b.id !== id);
  saveBookings(bookings);
  renderMyBookings();
  showToast(`Pass ${id} cancelled.`);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ==========================================================================
   ADMIN PORTAL & SALON MANAGEMENT LOGIC
   ========================================================================== */

const ADMIN_PASS_KEY = 'aura_blade_admin_pass_v1';
const ADMIN_AUTH_KEY = 'aura_blade_admin_auth_v1';
let currentAdminFilter = 'all';

function getAdminPasscode() {
  return localStorage.getItem(ADMIN_PASS_KEY) || 'admin123';
}

function setAdminPasscode(pass) {
  localStorage.setItem(ADMIN_PASS_KEY, pass);
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

function setAdminAuth(val) {
  if (val) {
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  }
}

// --- Admin Login & Auth Modals ---

function openAdminLogin() {
  if (isAdminLoggedIn()) {
    openAdminDashboard();
    return;
  }
  const modal = document.getElementById('adminLoginModal');
  if (modal) {
    modal.classList.add('active');
    const input = document.getElementById('adminPasscodeInput');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 150);
    }
    const err = document.getElementById('adminLoginError');
    if (err) err.style.display = 'none';
  }
}

function closeAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) modal.classList.remove('active');
  if (window.location.hash === '#admin') {
    history.replaceState(null, null, ' ');
  }
}

function togglePasscodeVisibility() {
  const input = document.getElementById('adminPasscodeInput');
  const eye = document.getElementById('adminPasscodeEye');
  if (!input || !eye) return;
  if (input.type === 'password') {
    input.type = 'text';
    eye.className = 'fa-regular fa-eye-slash';
  } else {
    input.type = 'password';
    eye.className = 'fa-regular fa-eye';
  }
}

function submitAdminLogin(e) {
  e.preventDefault();
  const input = document.getElementById('adminPasscodeInput');
  const err = document.getElementById('adminLoginError');
  if (!input) return;

  const entered = input.value.trim();
  const expected = getAdminPasscode();

  if (entered === expected) {
    setAdminAuth(true);
    closeAdminLogin();
    openAdminDashboard();
    showToast('🔓 Welcome to Staff & Admin Portal');
  } else {
    if (err) {
      err.textContent = 'Incorrect passcode. Please try again.';
      err.style.display = 'block';
    }
    input.select();
  }
}

// --- Admin Dashboard Container Controls ---

function openAdminDashboard() {
  const modal = document.getElementById('adminDashboardModal');
  if (!modal) return;
  modal.classList.add('active');

  // Update URL hash smoothly
  if (window.location.hash !== '#admin') {
    history.replaceState(null, null, '#admin');
  }

  // Refresh counts and render Overview by default
  updateAdminCounts();
  switchAdminTab('overview');
}

function closeAdminDashboard() {
  const modal = document.getElementById('adminDashboardModal');
  if (modal) modal.classList.remove('active');
  if (window.location.hash === '#admin') {
    history.replaceState(null, null, ' ');
  }
}

function logoutAdmin() {
  setAdminAuth(false);
  closeAdminDashboard();
  showToast('Logged out of Admin Portal.');
}

function switchAdminTab(tabName) {
  const tabs = ['overview', 'appointments', 'barbers', 'gallery', 'reviews', 'settings'];
  tabs.forEach(t => {
    const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
    const pane = document.getElementById('adminPane' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) btn.classList.toggle('active', t === tabName);
    if (pane) pane.style.display = (t === tabName) ? 'block' : 'none';
  });

  updateAdminCounts();

  if (tabName === 'overview') renderAdminOverview();
  else if (tabName === 'appointments') renderAdminAppointments();
  else if (tabName === 'barbers') renderAdminBarbers();
  else if (tabName === 'gallery') renderAdminGallery();
  else if (tabName === 'reviews') renderAdminReviews();
}

function updateAdminCounts() {
  const allBookings = getAllAdminBookings();
  const elAppts = document.getElementById('adminCountAppointments');
  if (elAppts) elAppts.textContent = allBookings.length;

  const elBarbers = document.getElementById('adminCountBarbers');
  if (elBarbers) elBarbers.textContent = BARBERS.length;

  const elGallery = document.getElementById('adminCountGallery');
  if (elGallery) elGallery.textContent = GALLERY_ITEMS.length;

  const reviews = firebaseDb ? firebaseLiveReviews : getLocalStorageReviews();
  const allReviewsCount = (firebaseDb && firebaseLiveReviews.length > 0) ? firebaseLiveReviews.length : (reviews.length + DEFAULT_REVIEWS.length);
  const elReviews = document.getElementById('adminCountReviews');
  if (elReviews) elReviews.textContent = allReviewsCount;
}

// --- Data Retrieval Helper ---

function getAllAdminBookings() {
  // Combine Firebase live bookings with local storage bookings, deduplicating by ID
  const map = new Map();

  // 1. Local bookings
  const local = getBookings();
  local.forEach(b => {
    if (b && b.id) map.set(b.id, b);
  });

  // 2. Firebase live bookings (primary source of truth across all devices)
  if (firebaseDb && firebaseLiveBookings.length > 0) {
    firebaseLiveBookings.forEach(b => {
      if (b && b.id) map.set(b.id, b);
    });
  }

  return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// --- Pane: Overview ---

function renderAdminOverview() {
  const bookings = getAllAdminBookings();
  const totalBookings = bookings.length;
  const confirmed = bookings.filter(b => (b.status || '').toUpperCase() === 'CONFIRMED').length;
  const completed = bookings.filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length;

  // Revenue from confirmed and completed bookings
  const estRevenue = bookings
    .filter(b => {
      const st = (b.status || '').toUpperCase();
      return st === 'CONFIRMED' || st === 'COMPLETED';
    })
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  // Reviews calculation
  const revList = (firebaseDb && firebaseLiveReviews.length > 0) ? firebaseLiveReviews : [...getLocalStorageReviews(), ...DEFAULT_REVIEWS];
  const avgRating = revList.length > 0 
    ? (revList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / revList.length).toFixed(1)
    : '5.0';

  // Update KPI displays
  const elTotalBookings = document.getElementById('kpiTotalBookings');
  if (elTotalBookings) elTotalBookings.textContent = totalBookings;

  const elConfirmed = document.getElementById('kpiConfirmedBookings');
  if (elConfirmed) elConfirmed.textContent = `${confirmed} confirmed • ${completed} completed`;

  const elRevenue = document.getElementById('kpiEstRevenue');
  if (elRevenue) elRevenue.textContent = `$${estRevenue}`;

  const elBarbers = document.getElementById('kpiTotalBarbers');
  if (elBarbers) elBarbers.textContent = BARBERS.length;

  const elAvgRating = document.getElementById('kpiAvgRating');
  if (elAvgRating) elAvgRating.textContent = `${avgRating} ★`;

  const elRevCount = document.getElementById('kpiTotalReviews');
  if (elRevCount) elRevCount.textContent = `${revList.length} customer reviews`;

  // Render recent 5 bookings table
  const container = document.getElementById('adminRecentBookingsTable');
  if (!container) return;

  const recent = bookings.slice(0, 5);
  if (recent.length === 0) {
    container.innerHTML = `
      <div style="padding:2.5rem; text-align:center; color:#6B7280;">
        <i class="fa-solid fa-calendar-xmark" style="font-size:2rem; margin-bottom:0.5rem; color:#9CA3AF;"></i>
        <p>No customer appointments recorded yet. New bookings will automatically stream here.</p>
      </div>
    `;
    return;
  }

  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Pass ID</th>
          <th>Client</th>
          <th>Service</th>
          <th>Barber</th>
          <th>Date & Time</th>
          <th>Price</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  recent.forEach(b => {
    const st = (b.status || 'CONFIRMED').toUpperCase();
    let badgeClass = 'status-confirmed';
    if (st === 'COMPLETED') badgeClass = 'status-completed';
    else if (st === 'CANCELLED') badgeClass = 'status-cancelled';

    html += `
      <tr>
        <td style="font-weight:700; font-family:monospace; color:#111827;">${b.id}</td>
        <td>
          <div style="font-weight:600; color:#111827;">${b.custName || 'Walk-In Guest'}</div>
          <div style="font-size:0.75rem; color:#6B7280;">${b.custPhone || 'No Phone'}</div>
        </td>
        <td>${b.serviceName}</td>
        <td>${b.barberName}</td>
        <td>${b.date} • <strong>${b.time}</strong></td>
        <td style="font-weight:700;">$${b.price}</td>
        <td><span class="admin-status-badge ${badgeClass}">${st.toLowerCase()}</span></td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// --- Pane: Appointments Manager ---

function filterAdminBookings(status) {
  currentAdminFilter = status;
  const btns = ['All', 'Confirmed', 'Completed', 'Cancelled'];
  btns.forEach(name => {
    const btn = document.getElementById('filterBtn' + name);
    if (btn) {
      if (currentAdminFilter.toLowerCase() === name.toLowerCase()) {
        btn.style.background = '#111827';
        btn.style.color = '#FFFFFF';
        btn.style.borderColor = '#111827';
      } else {
        btn.style.background = '#FFFFFF';
        btn.style.color = '#374151';
        btn.style.borderColor = '#D1D5DB';
      }
    }
  });

  const label = document.getElementById('appointmentsFilterLabel');
  if (label) {
    label.textContent = status === 'all' ? '' : `(Filtered: ${status})`;
  }

  renderAdminAppointments();
}

function renderAdminAppointments() {
  const container = document.getElementById('adminFullBookingsTable');
  if (!container) return;

  let bookings = getAllAdminBookings();

  if (currentAdminFilter !== 'all') {
    bookings = bookings.filter(b => (b.status || '').toUpperCase() === currentAdminFilter.toUpperCase());
  }

  if (bookings.length === 0) {
    container.innerHTML = `
      <div style="padding:3rem; text-align:center; color:#6B7280;">
        <i class="fa-solid fa-calendar-xmark" style="font-size:2.2rem; margin-bottom:0.75rem; color:#9CA3AF;"></i>
        <p style="font-size:0.95rem;">No appointments found matching this filter.</p>
      </div>
    `;
    return;
  }

  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Booking ID</th>
          <th>Client Details</th>
          <th>Service & Beverage</th>
          <th>Barber</th>
          <th>Date & Time</th>
          <th>Total</th>
          <th>Status</th>
          <th style="text-align:center;">Manage</th>
        </tr>
      </thead>
      <tbody>
  `;

  bookings.forEach(b => {
    const st = (b.status || 'CONFIRMED').toUpperCase();
    let badgeClass = 'status-confirmed';
    if (st === 'COMPLETED') badgeClass = 'status-completed';
    else if (st === 'CANCELLED') badgeClass = 'status-cancelled';

    html += `
      <tr>
        <td style="font-weight:700; font-family:monospace; color:#111827;">${b.id}</td>
        <td>
          <div style="font-weight:700; color:#111827;">${b.custName || 'Walk-in'}</div>
          <div style="font-size:0.75rem; color:#6B7280;"><i class="fa-solid fa-phone" style="font-size:0.65rem;"></i> ${b.custPhone || 'N/A'}</div>
          ${b.custEmail ? `<div style="font-size:0.72rem; color:#9CA3AF;">${b.custEmail}</div>` : ''}
        </td>
        <td>
          <div style="font-weight:600;">${b.serviceName}</div>
          <div style="font-size:0.75rem; color:#6B7280;">☕ ${b.beverage || 'Complimentary Water'}</div>
        </td>
        <td style="font-weight:600;">${b.barberName}</td>
        <td>
          <div>${b.date}</div>
          <div style="font-weight:700; color:#111827;">${b.time}</div>
        </td>
        <td style="font-weight:800; font-size:0.95rem; color:#111827;">$${b.price}</td>
        <td><span class="admin-status-badge ${badgeClass}">${st.toLowerCase()}</span></td>
        <td>
          <div style="display:flex; gap:0.35rem; justify-content:center;">
            ${st !== 'COMPLETED' ? `
              <button class="admin-btn-action success" title="Mark Completed" onclick="updateAdminBookingStatus('${b.id}', 'COMPLETED')">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : ''}
            ${st !== 'CONFIRMED' ? `
              <button class="admin-btn-action" title="Mark Confirmed" onclick="updateAdminBookingStatus('${b.id}', 'CONFIRMED')">
                <i class="fa-solid fa-thumbs-up"></i>
              </button>
            ` : ''}
            ${st !== 'CANCELLED' ? `
              <button class="admin-btn-action danger" title="Mark Cancelled" onclick="updateAdminBookingStatus('${b.id}', 'CANCELLED')">
                <i class="fa-solid fa-ban"></i>
              </button>
            ` : ''}
            <button class="admin-btn-action danger" title="Delete Permanently" onclick="deleteAdminBooking('${b.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function updateAdminBookingStatus(id, newStatus) {
  // 1. Update in local storage
  const local = getBookings();
  const found = local.find(b => b.id === id);
  if (found) {
    found.status = newStatus;
    saveBookings(local);
  }

  // 2. Update in Firebase Realtime Database
  if (firebaseDb && firebaseBookingsRef) {
    firebaseBookingsRef.orderByChild('id').equalTo(id).once('value', snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          child.ref.update({ status: newStatus });
        });
      }
    }).catch(err => console.warn('Firebase status update error:', err));
  }

  // 3. Update in memory live bookings
  const live = firebaseLiveBookings.find(b => b.id === id);
  if (live) live.status = newStatus;

  renderAdminAppointments();
  renderAdminOverview();
  renderMyBookings();
  showToast(`Booking ${id} status updated to ${newStatus}.`);
}

function deleteAdminBooking(id) {
  if (!confirm(`Are you sure you want to delete appointment ${id} permanently?`)) return;

  // 1. Remove from local storage
  let local = getBookings();
  local = local.filter(b => b.id !== id);
  saveBookings(local);

  // 2. Remove from Firebase Realtime Database
  if (firebaseDb && firebaseBookingsRef) {
    firebaseBookingsRef.orderByChild('id').equalTo(id).once('value', snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(child => child.ref.remove());
      }
    }).catch(err => console.warn('Firebase booking delete error:', err));
  }

  // 3. Update memory live bookings
  firebaseLiveBookings = firebaseLiveBookings.filter(b => b.id !== id);

  renderAdminAppointments();
  renderAdminOverview();
  renderMyBookings();
  showToast(`Appointment ${id} removed.`);
}

// --- Pane: Barbers Management ---

function renderAdminBarbers() {
  const container = document.getElementById('adminBarbersGrid');
  if (!container) return;
  container.innerHTML = '';

  BARBERS.forEach(b => {
    const isAny = (b.id === 'b-any');
    const card = document.createElement('div');
    card.className = 'admin-entity-card';
    card.innerHTML = `
      <img src="${b.avatar}" alt="${b.name.en}" class="admin-card-media">
      <div class="admin-card-content">
        <h4>${b.name.en} ${b.name.ar ? `<span style="font-size:0.8rem; font-weight:normal; color:#6B7280;">(${b.name.ar})</span>` : ''}</h4>
        <div class="entity-role">${b.role.en || b.role}</div>
        <p>${b.bio.en || b.bio}</p>
        <div class="admin-card-footer">
          <span style="font-size:0.75rem; color:#6B7280; font-family:monospace;">ID: ${b.id}</span>
          ${!isAny ? `
            <button class="admin-btn-action danger" onclick="deleteAdminBarber('${b.id}')">
              <i class="fa-solid fa-trash"></i> Remove
            </button>
          ` : `
            <span style="font-size:0.72rem; color:#9CA3AF; font-style:italic;">Default System Slot</span>
          `}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openAddBarberModal() {
  const modal = document.getElementById('addBarberModal');
  if (modal) modal.classList.add('active');
}

function closeAddBarberModal() {
  const modal = document.getElementById('addBarberModal');
  if (modal) modal.classList.remove('active');
}

function submitAddBarber(e) {
  e.preventDefault();
  const nameEn = document.getElementById('newBarberNameEn').value.trim();
  const nameAm = document.getElementById('newBarberNameAm').value.trim() || nameEn;
  const nameAr = document.getElementById('newBarberNameAr').value.trim() || nameEn;
  const roleEn = document.getElementById('newBarberRoleEn').value.trim();
  const bioEn = document.getElementById('newBarberBioEn').value.trim();
  const avatar = document.getElementById('newBarberAvatar').value.trim();

  const newBarber = {
    id: 'b-' + Date.now(),
    name: { en: nameEn, am: nameAm, ar: nameAr },
    role: { en: roleEn, am: roleEn, ar: roleEn },
    bio: { en: bioEn, am: bioEn, ar: bioEn },
    avatar: avatar
  };

  if (firebaseDb && firebaseBarbersRef) {
    firebaseBarbersRef.push(newBarber);
  } else {
    BARBERS.push(newBarber);
    renderTeam();
  }

  closeAddBarberModal();
  document.getElementById('addBarberForm').reset();
  renderAdminBarbers();
  showToast(`💈 Added ${nameEn} to barbers roster!`);
}

function deleteAdminBarber(id) {
  if (id === 'b-any') return;
  const barber = BARBERS.find(b => b.id === id);
  const name = barber ? barber.name.en : id;
  if (!confirm(`Are you sure you want to remove ${name} from the salon?`)) return;

  if (firebaseDb && firebaseBarbersRef) {
    if (barber && barber.firebaseKey) {
      firebaseBarbersRef.child(barber.firebaseKey).remove();
    } else {
      firebaseBarbersRef.orderByChild('id').equalTo(id).once('value', snap => {
        snap.forEach(child => child.ref.remove());
      });
    }
  }

  BARBERS = BARBERS.filter(b => b.id !== id);
  renderTeam();
  renderAdminBarbers();
  showToast(`Removed ${name} from barbers roster.`);
}

// --- Pane: Gallery Management ---

function renderAdminGallery() {
  const container = document.getElementById('adminGalleryGrid');
  if (!container) return;
  container.innerHTML = '';

  GALLERY_ITEMS.forEach((g, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-entity-card';
    card.innerHTML = `
      <img src="${g.img}" alt="${g.title}" class="admin-card-media">
      <div class="admin-card-content">
        <h4>${g.title}</h4>
        <div style="margin-bottom:0.75rem;">
          <span style="font-size:0.72rem; font-weight:700; background:#E5E7EB; color:#1F2937; padding:0.2rem 0.5rem; border-radius:999px; text-transform:uppercase;">
            ${g.category}
          </span>
        </div>
        <div class="admin-card-footer">
          <span style="font-size:0.72rem; color:#9CA3AF;">#${idx + 1}</span>
          <button class="admin-btn-action danger" onclick="deleteAdminGallery('${g.id || idx}')">
            <i class="fa-solid fa-trash"></i> Delete Photo
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openAddGalleryModal() {
  const modal = document.getElementById('addGalleryModal');
  if (modal) modal.classList.add('active');
}

function closeAddGalleryModal() {
  const modal = document.getElementById('addGalleryModal');
  if (modal) modal.classList.remove('active');
}

function submitAddGallery(e) {
  e.preventDefault();
  const title = document.getElementById('newGalleryTitle').value.trim();
  const category = document.getElementById('newGalleryCategory').value;
  const img = document.getElementById('newGalleryImg').value.trim();

  const newPhoto = {
    id: 'g-' + Date.now(),
    title: title,
    category: category,
    img: img
  };

  if (firebaseDb && firebaseGalleryRef) {
    firebaseGalleryRef.push(newPhoto);
  } else {
    GALLERY_ITEMS.unshift(newPhoto);
    renderGallery('all');
  }

  closeAddGalleryModal();
  document.getElementById('addGalleryForm').reset();
  renderAdminGallery();
  showToast('📸 New portfolio photo added!');
}

function deleteAdminGallery(idOrIndex) {
  if (!confirm('Are you sure you want to delete this portfolio photo?')) return;

  const item = GALLERY_ITEMS.find((g, i) => g.id === idOrIndex || String(i) === String(idOrIndex));
  if (item && item.firebaseKey && firebaseDb && firebaseGalleryRef) {
    firebaseGalleryRef.child(item.firebaseKey).remove();
  }

  GALLERY_ITEMS = GALLERY_ITEMS.filter((g, i) => g.id !== idOrIndex && String(i) !== String(idOrIndex));
  renderGallery('all');
  renderAdminGallery();
  showToast('Portfolio photo deleted.');
}

// --- Pane: Reviews Moderation ---

function renderAdminReviews() {
  const container = document.getElementById('adminReviewsGrid');
  if (!container) return;
  container.innerHTML = '';

  const list = (firebaseDb && firebaseLiveReviews.length > 0) ? firebaseLiveReviews : [...getLocalStorageReviews(), ...DEFAULT_REVIEWS];

  if (list.length === 0) {
    container.innerHTML = `
      <div style="padding:3rem; text-align:center; color:#6B7280; grid-column: 1 / -1;">
        <p>No customer reviews available to moderate.</p>
      </div>
    `;
    return;
  }

  list.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-entity-card';
    const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
    const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleDateString() : 'Original Customer';

    card.innerHTML = `
      <div class="admin-card-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <div style="color:#F59E0B; font-size:1rem; letter-spacing:0.1em;">${stars}</div>
          <span style="font-size:0.75rem; color:#9CA3AF;">${dateStr}</span>
        </div>
        <h4 style="margin:0 0 0.2rem 0;">${r.name}</h4>
        <div style="font-size:0.75rem; color:#6B7280; margin-bottom:0.75rem;">
          <i class="fa-solid fa-scissors" style="font-size:0.65rem;"></i> ${r.service || 'Executive Service'}
        </div>
        <p style="font-style:italic; color:#374151;">"${r.text}"</p>
        <div class="admin-card-footer">
          <span style="font-size:0.72rem; color:#9CA3AF;">Review #${idx + 1}</span>
          <button class="admin-btn-action danger" onclick="deleteAdminReview('${r.firebaseKey || r.timestamp || idx}')">
            <i class="fa-solid fa-trash"></i> Delete Review
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function deleteAdminReview(idKey) {
  if (!confirm('Are you sure you want to remove this review permanently?')) return;

  if (firebaseDb && firebaseReviewsRef) {
    // If it has a firebase key
    const match = firebaseLiveReviews.find(r => r.firebaseKey === idKey || String(r.timestamp) === String(idKey));
    if (match && match.firebaseKey) {
      firebaseReviewsRef.child(match.firebaseKey).remove();
    }
  }

  // Also remove from local storage if present
  let local = getLocalStorageReviews();
  local = local.filter(r => String(r.timestamp) !== String(idKey) && r.name !== idKey);
  saveToLocalStorage(local);

  renderReviews();
  renderAdminReviews();
  showToast('Review removed.');
}

// --- Pane: Settings & Security ---

function submitChangePasscode(e) {
  e.preventDefault();
  const current = document.getElementById('currentPasscodeInput').value;
  const newPass = document.getElementById('newPasscodeInput').value;
  const confirmPass = document.getElementById('confirmPasscodeInput').value;
  const msg = document.getElementById('adminSettingsMsg');

  if (current !== getAdminPasscode()) {
    if (msg) {
      msg.textContent = 'Current passcode does not match.';
      msg.style.color = '#DC2626';
      msg.style.display = 'block';
    }
    return;
  }

  if (newPass !== confirmPass) {
    if (msg) {
      msg.textContent = 'New passcode and confirmation do not match.';
      msg.style.color = '#DC2626';
      msg.style.display = 'block';
    }
    return;
  }

  setAdminPasscode(newPass);
  if (msg) {
    msg.textContent = '✓ Admin passcode updated successfully!';
    msg.style.color = '#059669';
    msg.style.display = 'block';
  }
  document.getElementById('adminChangePassForm').reset();
  showToast('🔒 Passcode updated successfully.');
}

function adminResetDefaultData() {
  if (!confirm('Re-seed initial default barbers, gallery photos, and reviews to Firebase? This will overwrite or supplement existing items.')) return;

  if (firebaseDb) {
    if (firebaseBarbersRef) {
      DEFAULT_BARBERS.forEach(b => firebaseBarbersRef.push(b));
    }
    if (firebaseGalleryRef) {
      DEFAULT_GALLERY.forEach(g => firebaseGalleryRef.push(g));
    }
    if (firebaseReviewsRef) {
      DEFAULT_REVIEWS.forEach(r => firebaseReviewsRef.push(r));
    }
    showToast('Default data re-seeded to Firebase.');
  } else {
    BARBERS = [...DEFAULT_BARBERS];
    GALLERY_ITEMS = [...DEFAULT_GALLERY];
    REVIEWS = [...DEFAULT_REVIEWS];
    renderTeam();
    renderGallery('all');
    renderReviews();
    showToast('Default data reset in local memory.');
  }

  renderAdminBarbers();
  renderAdminGallery();
  renderAdminReviews();
}


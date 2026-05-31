import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Lang = "de" | "en" | "ar" | "fa" | "sq" | "es" | "fr" | "tr";

export const LANGUAGES: { code: Lang; label: string; native: string; flag: string; rtl?: boolean }[] = [
  { code: "de", label: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦", rtl: true },
  { code: "fa", label: "Persian", native: "فارسی", flag: "🇮🇷", rtl: true },
  { code: "sq", label: "Albanian", native: "Shqip", flag: "🇦🇱" },
  { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷" },
  { code: "tr", label: "Turkish", native: "Türkçe", flag: "🇹🇷" },
];

// Translation dictionary. Keys are the German source strings.
// Missing keys fall back to the German source.
// `t()` supports {placeholder} substitution: t("Es gibt {count} Einträge", { count: 5 })
type Dict = Record<string, string>;

const en: Dict = {
  // Generic
  "Menü": "Menu", "Meine Schichten": "My shifts", "Export (PDF / CSV)": "Export (PDF / CSV)",
  "Einstellungen": "Settings", "Heller Modus": "Light mode", "Dunkler Modus": "Dark mode",
  "Abmelden": "Sign out", "Sprache": "Language", "Wachbuch": "Logbook", "Abbrechen": "Cancel",
  "Speichern": "Save", "Gespeichert": "Saved", "Hinzufügen": "Add", "Löschen": "Delete",
  "Bearbeiten": "Edit", "Schließen": "Close", "Bestätigen": "Confirm", "Weiter": "Continue",
  "Zurück": "Back", "Laden...": "Loading...", "Suchen": "Search", "Filter": "Filter",
  "Alle": "All", "Heute": "Today", "Gestern": "Yesterday", "Diese Woche": "This week",
  "Dieser Monat": "This month", "Letzter Monat": "Last month", "Ja": "Yes", "Nein": "No",
  "Fehler": "Error", "Erfolgreich": "Success", "Ein Fehler ist aufgetreten.": "An error occurred.",

  // Auth
  "Willkommen zurück": "Welcome back", "Melde dich an, um fortzufahren": "Sign in to continue",
  "Passwort vergessen": "Forgot password", "Wir senden dir einen Link zum Zurücksetzen": "We'll send you a reset link",
  "Anmelden": "Sign in", "Link senden": "Send link", "Passwort vergessen?": "Forgot password?",
  "E-Mail": "Email", "Passwort": "Password", "Bitte E-Mail eingeben": "Please enter email",
  "Bitte Passwort eingeben": "Please enter password", "oder weiter mit": "or continue with",
  "Zurück zur Anmeldung": "Back to sign in",
  "Zugang nur auf Einladung. Bitte kontaktiere deinen Administrator.": "Access by invitation only. Please contact your administrator.",
  "E-Mail oder Passwort ungültig.": "Invalid email or password.",
  "Bitte bestätige zuerst deine E-Mail.": "Please confirm your email first.",
  "Diese E-Mail ist bereits registriert.": "This email is already registered.",
  "Zu viele Versuche. Bitte später erneut.": "Too many attempts. Please try again later.",
  "Willkommen zurück!": "Welcome back!", "E-Mail zum Zurücksetzen gesendet!": "Reset email sent!",
  "Sicher & verschlüsselt": "Secure & encrypted", "PDF Export": "PDF Export",
  "Arbeitszeit-Erfassung & Schichtplanung für dein Sicherheitsteam.": "Time tracking & shift planning for your security team.",

  // SOS
  "SOS NOTRUF": "SOS EMERGENCY", "Notruf auslösen?": "Trigger emergency?",
  "Kurze Nachricht (optional)": "Short message (optional)", "Notruf senden": "Send emergency",
  "Sende…": "Sending…", "Notruf abgesendet": "Emergency sent", "Notruf fehlgeschlagen": "Emergency failed",
  "SOS-Notruf in der Nähe": "SOS alert nearby",

  // Shifts
  "Annehmen": "Accept", "Ablehnen": "Decline", "Akzeptieren": "Accept",
  "Standort freigeben": "Share location", "Standort freigegeben": "Location shared",
  "Freigabe erforderlich": "Consent required", "Geofence verlassen": "Left geofence",
  "Wieder im Einsatzbereich": "Back in zone", "Schicht angenommen": "Shift accepted",
  "Schicht abgelehnt": "Shift declined", "Kannst du diese Schicht übernehmen?": "Can you take this shift?",
  "Angenommen": "Accepted", "Abgelehnt": "Declined", "Route": "Route",
  "Diese Schicht wurde vom Admin storniert.": "This shift was cancelled by the admin.",
  "Live-Standort wird an deinen Admin gesendet. App geöffnet lassen.": "Live location is being sent to your admin. Keep the app open.",
  "Ablehnen – Stunden zählen nicht": "Declined – hours don't count",
  "Standort blockiert": "Location blocked", "GPS-Timeout – bitte erneut versuchen": "GPS timeout – please retry",
  "Dieses Gerät unterstützt kein GPS": "This device doesn't support GPS",
  "Standort-Zugriff fehlgeschlagen": "Location access failed",
  "Standort-Freigabe aktiv – Live-Übertragung läuft": "Location sharing active – live broadcast running",
  "Stunden werden für diese Schicht nicht angerechnet": "Hours won't be counted for this shift",
  "Bitte zurück zum Einsatzort.": "Please return to the work location.",
  "Bitte zurück zum Einsatzort. Der Admin wurde über deinen Standort informiert.": "Please return to the location. Admin has been notified.",
  "Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden nicht angerechnet.": "This shift requires location sharing. Without it, hours won't count.",
  "Reinigung": "Cleaning", "Security": "Security",

  // Work entry form
  "Neuer Eintrag": "New entry", "Eintrag speichern": "Save entry", "Einträge speichern": "Save entries",
  "Eintrag gespeichert!": "Entry saved!", "Datum": "Date", "Von": "From", "Bis": "To",
  "Uhrzeit von": "Time from", "Uhrzeit bis": "Time to", "Pause (Min.)": "Break (min)",
  "Abziehen": "Deduct", "Nicht abziehen": "Don't deduct", "Projekt": "Project",
  "Kein Projekt": "No project", "Ort": "Location", "Tätigkeit": "Activity",
  "Was hast du gemacht?": "What did you do?", "Bitte alle Felder ausfüllen": "Please fill all fields",
  "End-Datum muss nach Start-Datum liegen": "End date must be after start date",
  "Maximal 60 Tage auf einmal": "Maximum 60 days at once",
  "Zeitraum (mehrere Tage)": "Date range (multiple days)", "Einzelner Tag": "Single day",
  "z.B. Büro Berlin, Baustelle München...": "e.g. Berlin office, Munich site...",

  // Settings
  "Profilbild": "Profile picture", "Wöchentliche Soll-Stunden": "Weekly target hours",
  "Projekte": "Projects", "Projektname": "Project name", "Kunde (optional)": "Client (optional)",
  "Konto verknüpfen": "Link account",
  "Verknüpfe Google oder Apple, um dich auch ohne Passwort anmelden zu können.": "Link Google or Apple to sign in without a password.",
  "Google verknüpft": "Google linked", "Google verknüpfen": "Link Google",
  "Apple verknüpft": "Apple linked", "Apple verknüpfen": "Link Apple",
  "Verknüpfung fehlgeschlagen": "Linking failed", "Projekt existiert bereits": "Project already exists",

  // Export
  "Export": "Export", "Alle Einträge": "All entries", "Bestimmter Monat": "Specific month",
  "Zeitraum": "Date range", "{count} Einträge ausgewählt": "{count} entries selected",
  "Keine Einträge im gewählten Zeitraum": "No entries in selected range",
  "Export fehlgeschlagen": "Export failed",

  // Work entries list
  "Einträge laden...": "Loading entries...", "Keine Einträge": "No entries",
  "Ort oder Tätigkeit suchen…": "Search location or activity…",
  "Ort oder Tätigkeit suchen": "Search location or activity",
  "{count} Einträge gespeichert!": "{count} entries saved!",

  // Stats
  "Meine Arbeit": "My work", "Schicht-Einteilung": "Shift planning",
  "Gesamt": "Total", "Stunden": "Hours", "Stunden gearbeitet": "Hours worked",
  "Wochenstunden": "Weekly hours", "Überstunden": "Overtime", "Ziel": "Target",
  "Eintrag": "Entry", "Einträge": "Entries",

  // Patrol / Guard log
  "Patrouille": "Patrol", "Punkt scannen": "Scan point", "QR-Code scannen": "Scan QR code",
  "NFC-Tag scannen": "Scan NFC tag", "Scan erfolgreich": "Scan successful",
  "Scan fehlgeschlagen": "Scan failed", "Unbekannter Punkt": "Unknown point",
  "Eintrag löschen": "Delete entry", "Foto hinzufügen": "Add photo", "Notiz": "Note",

  // Shift clock
  "Einstempeln": "Clock in", "Ausstempeln": "Clock out", "Aktive Schicht": "Active shift",
  "Schicht läuft": "Shift running", "Eingestempelt": "Clocked in", "Ausgestempelt": "Clocked out",

  // Daily reminder
  "Tägliche Erinnerung": "Daily reminder", "Erinnerung aktiv": "Reminder active",
  "Benachrichtigungen blockiert": "Notifications blocked",
};

const ar: Dict = {
  "Menü": "القائمة", "Meine Schichten": "ورديّاتي", "Export (PDF / CSV)": "تصدير (PDF / CSV)",
  "Einstellungen": "الإعدادات", "Heller Modus": "الوضع الفاتح", "Dunkler Modus": "الوضع الداكن",
  "Abmelden": "تسجيل الخروج", "Sprache": "اللغة", "Wachbuch": "دفتر الحراسة", "Abbrechen": "إلغاء",
  "Speichern": "حفظ", "Gespeichert": "تم الحفظ", "Hinzufügen": "إضافة", "Löschen": "حذف",
  "Bearbeiten": "تعديل", "Schließen": "إغلاق", "Bestätigen": "تأكيد", "Weiter": "متابعة",
  "Zurück": "رجوع", "Laden...": "جارٍ التحميل...", "Suchen": "بحث", "Filter": "تصفية",
  "Alle": "الكل", "Heute": "اليوم", "Gestern": "أمس", "Diese Woche": "هذا الأسبوع",
  "Dieser Monat": "هذا الشهر", "Letzter Monat": "الشهر الماضي", "Ja": "نعم", "Nein": "لا",
  "Fehler": "خطأ", "Erfolgreich": "تم بنجاح", "Ein Fehler ist aufgetreten.": "حدث خطأ.",

  "Willkommen zurück": "أهلاً بعودتك", "Melde dich an, um fortzufahren": "سجّل الدخول للمتابعة",
  "Passwort vergessen": "نسيت كلمة المرور", "Wir senden dir einen Link zum Zurücksetzen": "سنرسل لك رابط إعادة التعيين",
  "Anmelden": "تسجيل الدخول", "Link senden": "إرسال الرابط", "Passwort vergessen?": "نسيت كلمة المرور؟",
  "E-Mail": "البريد الإلكتروني", "Passwort": "كلمة المرور",
  "Bitte E-Mail eingeben": "يرجى إدخال البريد الإلكتروني", "Bitte Passwort eingeben": "يرجى إدخال كلمة المرور",
  "oder weiter mit": "أو المتابعة باستخدام", "Zurück zur Anmeldung": "العودة لتسجيل الدخول",
  "Zugang nur auf Einladung. Bitte kontaktiere deinen Administrator.": "الوصول بدعوة فقط. يرجى التواصل مع المسؤول.",
  "E-Mail oder Passwort ungültig.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Bitte bestätige zuerst deine E-Mail.": "يرجى تأكيد بريدك الإلكتروني أولاً.",
  "Diese E-Mail ist bereits registriert.": "هذا البريد الإلكتروني مسجل بالفعل.",
  "Zu viele Versuche. Bitte später erneut.": "محاولات كثيرة جداً. يرجى المحاولة لاحقاً.",
  "Willkommen zurück!": "مرحباً بعودتك!", "E-Mail zum Zurücksetzen gesendet!": "تم إرسال بريد إعادة التعيين!",
  "Sicher & verschlüsselt": "آمن ومشفّر", "PDF Export": "تصدير PDF",
  "Arbeitszeit-Erfassung & Schichtplanung für dein Sicherheitsteam.": "تسجيل ساعات العمل وتخطيط الورديات لفريق الأمن لديك.",

  "SOS NOTRUF": "نداء استغاثة", "Notruf auslösen?": "إطلاق نداء الاستغاثة؟",
  "Kurze Nachricht (optional)": "رسالة قصيرة (اختياري)", "Notruf senden": "إرسال الاستغاثة",
  "Sende…": "جارٍ الإرسال…", "Notruf abgesendet": "تم إرسال الاستغاثة",
  "Notruf fehlgeschlagen": "فشل إرسال الاستغاثة", "SOS-Notruf in der Nähe": "نداء استغاثة قريب",

  "Annehmen": "قبول", "Ablehnen": "رفض", "Akzeptieren": "قبول",
  "Standort freigeben": "مشاركة الموقع", "Standort freigegeben": "تمت مشاركة الموقع",
  "Freigabe erforderlich": "الموافقة مطلوبة", "Geofence verlassen": "خرجت من النطاق",
  "Wieder im Einsatzbereich": "عدت إلى النطاق", "Schicht angenommen": "تم قبول الوردية",
  "Schicht abgelehnt": "تم رفض الوردية", "Kannst du diese Schicht übernehmen?": "هل يمكنك تولّي هذه الوردية؟",
  "Angenommen": "مقبولة", "Abgelehnt": "مرفوضة", "Route": "المسار",
  "Diese Schicht wurde vom Admin storniert.": "تم إلغاء هذه الوردية من قِبل المسؤول.",
  "Live-Standort wird an deinen Admin gesendet. App geöffnet lassen.": "يتم إرسال موقعك المباشر إلى المسؤول. أبقِ التطبيق مفتوحًا.",
  "Ablehnen – Stunden zählen nicht": "مرفوض – لن تُحتسب الساعات",
  "Standort blockiert": "تم حظر الموقع", "GPS-Timeout – bitte erneut versuchen": "انتهت مهلة GPS – حاول مجدداً",
  "Dieses Gerät unterstützt kein GPS": "هذا الجهاز لا يدعم GPS",
  "Standort-Zugriff fehlgeschlagen": "فشل الوصول إلى الموقع",
  "Standort-Freigabe aktiv – Live-Übertragung läuft": "مشاركة الموقع نشطة – البث المباشر يعمل",
  "Stunden werden für diese Schicht nicht angerechnet": "لن تُحتسب ساعات هذه الوردية",
  "Bitte zurück zum Einsatzort.": "يرجى العودة إلى موقع العمل.",
  "Bitte zurück zum Einsatzort. Der Admin wurde über deinen Standort informiert.": "يرجى العودة إلى الموقع. تم إبلاغ المسؤول بموقعك.",
  "Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden nicht angerechnet.": "تتطلب هذه الوردية مشاركة الموقع. بدونها لن تُحتسب الساعات.",
  "Reinigung": "تنظيف", "Security": "أمن",

  "Neuer Eintrag": "إدخال جديد", "Eintrag speichern": "حفظ الإدخال", "Einträge speichern": "حفظ الإدخالات",
  "Eintrag gespeichert!": "تم حفظ الإدخال!", "Datum": "التاريخ", "Von": "من", "Bis": "إلى",
  "Uhrzeit von": "من الساعة", "Uhrzeit bis": "إلى الساعة", "Pause (Min.)": "استراحة (دقيقة)",
  "Abziehen": "خصم", "Nicht abziehen": "بدون خصم", "Projekt": "المشروع",
  "Kein Projekt": "بدون مشروع", "Ort": "الموقع", "Tätigkeit": "النشاط",
  "Was hast du gemacht?": "ماذا فعلت؟", "Bitte alle Felder ausfüllen": "يرجى ملء جميع الحقول",
  "End-Datum muss nach Start-Datum liegen": "يجب أن يكون تاريخ الانتهاء بعد البداية",
  "Maximal 60 Tage auf einmal": "بحد أقصى 60 يوماً في المرة",
  "Zeitraum (mehrere Tage)": "نطاق زمني (عدة أيام)", "Einzelner Tag": "يوم واحد",
  "z.B. Büro Berlin, Baustelle München...": "مثل: مكتب برلين، موقع ميونخ...",

  "Profilbild": "صورة الملف الشخصي", "Wöchentliche Soll-Stunden": "ساعات أسبوعية مستهدفة",
  "Projekte": "المشاريع", "Projektname": "اسم المشروع", "Kunde (optional)": "عميل (اختياري)",
  "Konto verknüpfen": "ربط الحساب",
  "Verknüpfe Google oder Apple, um dich auch ohne Passwort anmelden zu können.": "اربط Google أو Apple لتسجيل الدخول بدون كلمة مرور.",
  "Google verknüpft": "Google مرتبط", "Google verknüpfen": "ربط Google",
  "Apple verknüpft": "Apple مرتبط", "Apple verknüpfen": "ربط Apple",
  "Verknüpfung fehlgeschlagen": "فشل الربط", "Projekt existiert bereits": "المشروع موجود بالفعل",

  "Export": "تصدير", "Alle Einträge": "كل الإدخالات", "Bestimmter Monat": "شهر محدد",
  "Zeitraum": "نطاق زمني", "{count} Einträge ausgewählt": "تم اختيار {count} إدخالاً",
  "Keine Einträge im gewählten Zeitraum": "لا توجد إدخالات في النطاق المحدد",
  "Export fehlgeschlagen": "فشل التصدير",

  "Einträge laden...": "جارٍ تحميل الإدخالات...", "Keine Einträge": "لا توجد إدخالات",
  "Ort oder Tätigkeit suchen…": "ابحث عن موقع أو نشاط…",
  "Ort oder Tätigkeit suchen": "ابحث عن موقع أو نشاط",
  "{count} Einträge gespeichert!": "تم حفظ {count} إدخالاً!",

  "Meine Arbeit": "عملي", "Schicht-Einteilung": "توزيع الورديات",
  "Gesamt": "الإجمالي", "Stunden": "ساعات", "Stunden gearbeitet": "ساعات العمل",
  "Wochenstunden": "ساعات أسبوعية", "Überstunden": "ساعات إضافية", "Ziel": "الهدف",
  "Eintrag": "إدخال", "Einträge": "إدخالات",

  "Patrouille": "الدورية", "Punkt scannen": "مسح نقطة", "QR-Code scannen": "مسح رمز QR",
  "NFC-Tag scannen": "مسح بطاقة NFC", "Scan erfolgreich": "تم المسح بنجاح",
  "Scan fehlgeschlagen": "فشل المسح", "Unbekannter Punkt": "نقطة غير معروفة",
  "Eintrag löschen": "حذف الإدخال", "Foto hinzufügen": "إضافة صورة", "Notiz": "ملاحظة",

  "Einstempeln": "بدء العمل", "Ausstempeln": "إنهاء العمل", "Aktive Schicht": "وردية نشطة",
  "Schicht läuft": "الوردية جارية", "Eingestempelt": "تم البدء", "Ausgestempelt": "تم الإنهاء",

  "Tägliche Erinnerung": "تذكير يومي", "Erinnerung aktiv": "التذكير مُفعّل",
  "Benachrichtigungen blockiert": "الإشعارات محظورة",
};

const fa: Dict = {
  "Menü": "منو", "Meine Schichten": "شیفت‌های من", "Export (PDF / CSV)": "خروجی (PDF / CSV)",
  "Einstellungen": "تنظیمات", "Heller Modus": "حالت روشن", "Dunkler Modus": "حالت تیره",
  "Abmelden": "خروج", "Sprache": "زبان", "Wachbuch": "دفتر نگهبانی", "Abbrechen": "لغو",
  "Speichern": "ذخیره", "Gespeichert": "ذخیره شد", "Hinzufügen": "افزودن", "Löschen": "حذف",
  "Bearbeiten": "ویرایش", "Schließen": "بستن", "Bestätigen": "تأیید", "Weiter": "ادامه",
  "Zurück": "بازگشت", "Laden...": "در حال بارگذاری...", "Suchen": "جستجو", "Filter": "فیلتر",
  "Alle": "همه", "Heute": "امروز", "Gestern": "دیروز", "Diese Woche": "این هفته",
  "Dieser Monat": "این ماه", "Letzter Monat": "ماه گذشته", "Ja": "بله", "Nein": "خیر",
  "Fehler": "خطا", "Erfolgreich": "موفق", "Ein Fehler ist aufgetreten.": "خطایی رخ داد.",

  "Willkommen zurück": "خوش آمدید", "Melde dich an, um fortzufahren": "برای ادامه وارد شوید",
  "Passwort vergessen": "فراموشی رمز عبور", "Wir senden dir einen Link zum Zurücksetzen": "لینک بازنشانی ارسال می‌کنیم",
  "Anmelden": "ورود", "Link senden": "ارسال لینک", "Passwort vergessen?": "رمز را فراموش کرده‌اید؟",
  "E-Mail": "ایمیل", "Passwort": "رمز عبور",
  "Bitte E-Mail eingeben": "لطفاً ایمیل را وارد کنید", "Bitte Passwort eingeben": "لطفاً رمز عبور را وارد کنید",
  "oder weiter mit": "یا ادامه با", "Zurück zur Anmeldung": "بازگشت به ورود",
  "Zugang nur auf Einladung. Bitte kontaktiere deinen Administrator.": "دسترسی فقط با دعوت‌نامه. لطفاً با مدیر تماس بگیرید.",
  "E-Mail oder Passwort ungültig.": "ایمیل یا رمز عبور نامعتبر است.",
  "Bitte bestätige zuerst deine E-Mail.": "لطفاً ابتدا ایمیل خود را تأیید کنید.",
  "Diese E-Mail ist bereits registriert.": "این ایمیل قبلاً ثبت شده است.",
  "Zu viele Versuche. Bitte später erneut.": "تلاش‌های زیاد. لطفاً بعداً امتحان کنید.",
  "Willkommen zurück!": "خوش آمدید!", "E-Mail zum Zurücksetzen gesendet!": "ایمیل بازنشانی ارسال شد!",
  "Sicher & verschlüsselt": "ایمن و رمزگذاری‌شده", "PDF Export": "خروجی PDF",
  "Arbeitszeit-Erfassung & Schichtplanung für dein Sicherheitsteam.": "ثبت ساعات کاری و برنامه‌ریزی شیفت برای تیم امنیتی شما.",

  "SOS NOTRUF": "تماس اضطراری", "Notruf auslösen?": "ارسال هشدار اضطراری؟",
  "Kurze Nachricht (optional)": "پیام کوتاه (اختیاری)", "Notruf senden": "ارسال هشدار",
  "Sende…": "در حال ارسال…", "Notruf abgesendet": "هشدار ارسال شد",
  "Notruf fehlgeschlagen": "ارسال هشدار ناموفق بود", "SOS-Notruf in der Nähe": "هشدار SOS نزدیک",

  "Annehmen": "پذیرفتن", "Ablehnen": "رد کردن", "Akzeptieren": "پذیرفتن",
  "Standort freigeben": "اشتراک موقعیت", "Standort freigegeben": "موقعیت به اشتراک گذاشته شد",
  "Freigabe erforderlich": "تأیید لازم است", "Geofence verlassen": "از محدوده خارج شدید",
  "Wieder im Einsatzbereich": "بازگشت به محدوده", "Schicht angenommen": "شیفت پذیرفته شد",
  "Schicht abgelehnt": "شیفت رد شد", "Kannst du diese Schicht übernehmen?": "آیا می‌توانید این شیفت را قبول کنید؟",
  "Angenommen": "پذیرفته‌شده", "Abgelehnt": "رد‌شده", "Route": "مسیر",
  "Diese Schicht wurde vom Admin storniert.": "این شیفت توسط مدیر لغو شده است.",
  "Live-Standort wird an deinen Admin gesendet. App geöffnet lassen.": "موقعیت زنده برای مدیر ارسال می‌شود. برنامه را باز نگه دارید.",
  "Ablehnen – Stunden zählen nicht": "رد شد – ساعت‌ها محاسبه نمی‌شوند",
  "Standort blockiert": "موقعیت مسدود شده", "GPS-Timeout – bitte erneut versuchen": "تایم‌اوت GPS – دوباره تلاش کنید",
  "Dieses Gerät unterstützt kein GPS": "این دستگاه GPS را پشتیبانی نمی‌کند",
  "Standort-Zugriff fehlgeschlagen": "دسترسی به موقعیت ناموفق بود",
  "Standort-Freigabe aktiv – Live-Übertragung läuft": "اشتراک موقعیت فعال است – ارسال زنده در جریان است",
  "Stunden werden für diese Schicht nicht angerechnet": "ساعات این شیفت محاسبه نمی‌شود",
  "Bitte zurück zum Einsatzort.": "لطفاً به محل کار بازگردید.",
  "Bitte zurück zum Einsatzort. Der Admin wurde über deinen Standort informiert.": "به محل بازگردید. مدیر از موقعیت شما مطلع شد.",
  "Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden nicht angerechnet.": "این شیفت نیاز به اشتراک موقعیت دارد. بدون آن ساعت‌ها محاسبه نمی‌شوند.",
  "Reinigung": "نظافت", "Security": "امنیتی",

  "Neuer Eintrag": "ثبت جدید", "Eintrag speichern": "ذخیره ثبت", "Einträge speichern": "ذخیره ثبت‌ها",
  "Eintrag gespeichert!": "ثبت ذخیره شد!", "Datum": "تاریخ", "Von": "از", "Bis": "تا",
  "Uhrzeit von": "از ساعت", "Uhrzeit bis": "تا ساعت", "Pause (Min.)": "استراحت (دقیقه)",
  "Abziehen": "کسر شود", "Nicht abziehen": "کسر نشود", "Projekt": "پروژه",
  "Kein Projekt": "بدون پروژه", "Ort": "محل", "Tätigkeit": "فعالیت",
  "Was hast du gemacht?": "چه کاری انجام دادید؟", "Bitte alle Felder ausfüllen": "لطفاً همه فیلدها را پر کنید",
  "End-Datum muss nach Start-Datum liegen": "تاریخ پایان باید بعد از شروع باشد",
  "Maximal 60 Tage auf einmal": "حداکثر ۶۰ روز در یک بار",
  "Zeitraum (mehrere Tage)": "بازه زمانی (چند روز)", "Einzelner Tag": "یک روز",
  "z.B. Büro Berlin, Baustelle München...": "مثال: دفتر برلین، کارگاه مونیخ...",

  "Profilbild": "تصویر پروفایل", "Wöchentliche Soll-Stunden": "ساعات هفتگی هدف",
  "Projekte": "پروژه‌ها", "Projektname": "نام پروژه", "Kunde (optional)": "مشتری (اختیاری)",
  "Konto verknüpfen": "اتصال حساب",
  "Verknüpfe Google oder Apple, um dich auch ohne Passwort anmelden zu können.": "Google یا Apple را متصل کنید تا بدون رمز وارد شوید.",
  "Google verknüpft": "Google متصل است", "Google verknüpfen": "اتصال به Google",
  "Apple verknüpft": "Apple متصل است", "Apple verknüpfen": "اتصال به Apple",
  "Verknüpfung fehlgeschlagen": "اتصال ناموفق بود", "Projekt existiert bereits": "پروژه قبلاً وجود دارد",

  "Export": "خروجی", "Alle Einträge": "همه ثبت‌ها", "Bestimmter Monat": "ماه مشخص",
  "Zeitraum": "بازه زمانی", "{count} Einträge ausgewählt": "{count} ثبت انتخاب شد",
  "Keine Einträge im gewählten Zeitraum": "هیچ ثبتی در بازه انتخابی نیست",
  "Export fehlgeschlagen": "خروجی ناموفق بود",

  "Einträge laden...": "در حال بارگذاری ثبت‌ها...", "Keine Einträge": "ثبتی نیست",
  "Ort oder Tätigkeit suchen…": "جستجوی محل یا فعالیت…",
  "Ort oder Tätigkeit suchen": "جستجوی محل یا فعالیت",
  "{count} Einträge gespeichert!": "{count} ثبت ذخیره شد!",

  "Meine Arbeit": "کار من", "Schicht-Einteilung": "تخصیص شیفت",
  "Gesamt": "مجموع", "Stunden": "ساعت", "Stunden gearbeitet": "ساعات کاری",
  "Wochenstunden": "ساعات هفتگی", "Überstunden": "اضافه‌کار", "Ziel": "هدف",
  "Eintrag": "ثبت", "Einträge": "ثبت‌ها",

  "Patrouille": "گشت", "Punkt scannen": "اسکن نقطه", "QR-Code scannen": "اسکن QR",
  "NFC-Tag scannen": "اسکن NFC", "Scan erfolgreich": "اسکن موفق",
  "Scan fehlgeschlagen": "اسکن ناموفق", "Unbekannter Punkt": "نقطه نامشخص",
  "Eintrag löschen": "حذف ثبت", "Foto hinzufügen": "افزودن عکس", "Notiz": "یادداشت",

  "Einstempeln": "ورود به شیفت", "Ausstempeln": "خروج از شیفت", "Aktive Schicht": "شیفت فعال",
  "Schicht läuft": "شیفت در جریان است", "Eingestempelt": "وارد شد", "Ausgestempelt": "خارج شد",

  "Tägliche Erinnerung": "یادآور روزانه", "Erinnerung aktiv": "یادآور فعال",
  "Benachrichtigungen blockiert": "اعلان‌ها مسدود است",
};

const sq: Dict = {
  "Menü": "Menyja", "Meine Schichten": "Turnet e mia", "Export (PDF / CSV)": "Eksporto (PDF / CSV)",
  "Einstellungen": "Cilësimet", "Heller Modus": "Modaliteti i ndritshëm", "Dunkler Modus": "Modaliteti i errët",
  "Abmelden": "Dilni", "Sprache": "Gjuha", "Wachbuch": "Libri i rojës", "Abbrechen": "Anulo",
  "Speichern": "Ruaj", "Gespeichert": "U ruajt", "Hinzufügen": "Shto", "Löschen": "Fshi",
  "Bearbeiten": "Modifiko", "Schließen": "Mbyll", "Bestätigen": "Konfirmo", "Weiter": "Vazhdo",
  "Zurück": "Mbrapa", "Laden...": "Po ngarkohet...", "Suchen": "Kërko", "Filter": "Filtri",
  "Alle": "Të gjitha", "Heute": "Sot", "Gestern": "Dje", "Diese Woche": "Këtë javë",
  "Dieser Monat": "Këtë muaj", "Letzter Monat": "Muajin e kaluar", "Ja": "Po", "Nein": "Jo",
  "Fehler": "Gabim", "Erfolgreich": "Sukses", "Ein Fehler ist aufgetreten.": "Ndodhi një gabim.",

  "Willkommen zurück": "Mirë se erdhe sërish", "Melde dich an, um fortzufahren": "Identifikohu për të vazhduar",
  "Passwort vergessen": "Harruat fjalëkalimin", "Wir senden dir einen Link zum Zurücksetzen": "Do të dërgojmë një lidhje rivendosjeje",
  "Anmelden": "Identifikohu", "Link senden": "Dërgo lidhjen", "Passwort vergessen?": "Harrove fjalëkalimin?",
  "E-Mail": "Email", "Passwort": "Fjalëkalimi",
  "Bitte E-Mail eingeben": "Ju lutemi vendosni email-in", "Bitte Passwort eingeben": "Ju lutemi vendosni fjalëkalimin",
  "oder weiter mit": "ose vazhdo me", "Zurück zur Anmeldung": "Kthehu te identifikimi",
  "Zugang nur auf Einladung. Bitte kontaktiere deinen Administrator.": "Qasja vetëm me ftesë. Kontaktoni administratorin.",
  "E-Mail oder Passwort ungültig.": "Email ose fjalëkalim i pavlefshëm.",
  "Bitte bestätige zuerst deine E-Mail.": "Konfirmo fillimisht email-in tënd.",
  "Diese E-Mail ist bereits registriert.": "Ky email është regjistruar tashmë.",
  "Zu viele Versuche. Bitte später erneut.": "Shumë përpjekje. Provo më vonë.",
  "Willkommen zurück!": "Mirë se erdhe!", "E-Mail zum Zurücksetzen gesendet!": "Email-i i rivendosjes u dërgua!",
  "Sicher & verschlüsselt": "I sigurt & i koduar", "PDF Export": "Eksport PDF",
  "Arbeitszeit-Erfassung & Schichtplanung für dein Sicherheitsteam.": "Regjistrim i orarit dhe planifikim turnesh për ekipin tënd.",

  "SOS NOTRUF": "THIRRJE SOS", "Notruf auslösen?": "Aktivizoni alarmin?",
  "Kurze Nachricht (optional)": "Mesazh i shkurtër (opsional)", "Notruf senden": "Dërgo alarmin",
  "Sende…": "Po dërgohet…", "Notruf abgesendet": "Alarmi u dërgua",
  "Notruf fehlgeschlagen": "Dërgimi i alarmit dështoi", "SOS-Notruf in der Nähe": "Alarm SOS afër",

  "Annehmen": "Prano", "Ablehnen": "Refuzo", "Akzeptieren": "Prano",
  "Standort freigeben": "Ndaj vendndodhjen", "Standort freigegeben": "Vendndodhja u nda",
  "Freigabe erforderlich": "Kërkohet miratim", "Geofence verlassen": "Dolët nga zona",
  "Wieder im Einsatzbereich": "Përsëri brenda zonës", "Schicht angenommen": "Turni u pranua",
  "Schicht abgelehnt": "Turni u refuzua", "Kannst du diese Schicht übernehmen?": "Mund ta marrësh këtë turn?",
  "Angenommen": "Pranuar", "Abgelehnt": "Refuzuar", "Route": "Rruga",
  "Diese Schicht wurde vom Admin storniert.": "Ky turn u anulua nga administratori.",
  "Live-Standort wird an deinen Admin gesendet. App geöffnet lassen.": "Vendndodhja po i dërgohet adminit. Mbaje aplikacionin hapur.",
  "Ablehnen – Stunden zählen nicht": "Refuzuar – orët nuk numërohen",
  "Standort blockiert": "Vendndodhja e bllokuar", "GPS-Timeout – bitte erneut versuchen": "Skadim GPS – provo sërish",
  "Dieses Gerät unterstützt kein GPS": "Kjo pajisje nuk mbështet GPS",
  "Standort-Zugriff fehlgeschlagen": "Qasja te vendndodhja dështoi",
  "Standort-Freigabe aktiv – Live-Übertragung läuft": "Ndarja e vendndodhjes aktive – transmetim live",
  "Stunden werden für diese Schicht nicht angerechnet": "Orët nuk do të numërohen për këtë turn",
  "Bitte zurück zum Einsatzort.": "Kthehu te vendi i punës.",
  "Bitte zurück zum Einsatzort. Der Admin wurde über deinen Standort informiert.": "Kthehu te vendi. Admini u informua për vendndodhjen tënde.",
  "Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden nicht angerechnet.": "Ky turn kërkon ndarje të vendndodhjes. Pa të, orët nuk numërohen.",
  "Reinigung": "Pastrim", "Security": "Siguri",

  "Neuer Eintrag": "Hyrje e re", "Eintrag speichern": "Ruaj hyrjen", "Einträge speichern": "Ruaj hyrjet",
  "Eintrag gespeichert!": "Hyrja u ruajt!", "Datum": "Data", "Von": "Nga", "Bis": "Deri",
  "Uhrzeit von": "Ora nga", "Uhrzeit bis": "Ora deri", "Pause (Min.)": "Pushim (min)",
  "Abziehen": "Zbrit", "Nicht abziehen": "Mos zbrit", "Projekt": "Projekti",
  "Kein Projekt": "Pa projekt", "Ort": "Vendi", "Tätigkeit": "Aktiviteti",
  "Was hast du gemacht?": "Çfarë bëre?", "Bitte alle Felder ausfüllen": "Plotëso të gjitha fushat",
  "End-Datum muss nach Start-Datum liegen": "Data e mbarimit duhet të jetë pas fillimit",
  "Maximal 60 Tage auf einmal": "Maksimumi 60 ditë në një herë",
  "Zeitraum (mehrere Tage)": "Periudhë (disa ditë)", "Einzelner Tag": "Një ditë",
  "z.B. Büro Berlin, Baustelle München...": "p.sh. Zyra Berlin, kantieri Mynih...",

  "Profilbild": "Foto e profilit", "Wöchentliche Soll-Stunden": "Orët javore të synuara",
  "Projekte": "Projektet", "Projektname": "Emri i projektit", "Kunde (optional)": "Klient (opsional)",
  "Konto verknüpfen": "Lidh llogarinë",
  "Verknüpfe Google oder Apple, um dich auch ohne Passwort anmelden zu können.": "Lidh Google ose Apple për t'u kyçur pa fjalëkalim.",
  "Google verknüpft": "Google i lidhur", "Google verknüpfen": "Lidh Google",
  "Apple verknüpft": "Apple i lidhur", "Apple verknüpfen": "Lidh Apple",
  "Verknüpfung fehlgeschlagen": "Lidhja dështoi", "Projekt existiert bereits": "Projekti ekziston tashmë",

  "Export": "Eksport", "Alle Einträge": "Të gjitha hyrjet", "Bestimmter Monat": "Muaji specifik",
  "Zeitraum": "Periudha", "{count} Einträge ausgewählt": "{count} hyrje të zgjedhura",
  "Keine Einträge im gewählten Zeitraum": "Asnjë hyrje në periudhën e zgjedhur",
  "Export fehlgeschlagen": "Eksporti dështoi",

  "Einträge laden...": "Po ngarkohen hyrjet...", "Keine Einträge": "Asnjë hyrje",
  "Ort oder Tätigkeit suchen…": "Kërko vend ose aktivitet…",
  "Ort oder Tätigkeit suchen": "Kërko vend ose aktivitet",
  "{count} Einträge gespeichert!": "{count} hyrje u ruajtën!",

  "Meine Arbeit": "Puna ime", "Schicht-Einteilung": "Caktimi i turneve",
  "Gesamt": "Gjithsej", "Stunden": "Orë", "Stunden gearbeitet": "Orë të punuara",
  "Wochenstunden": "Orë javore", "Überstunden": "Orë shtesë", "Ziel": "Synimi",
  "Eintrag": "Hyrje", "Einträge": "Hyrje",

  "Patrouille": "Patrullë", "Punkt scannen": "Skano pikën", "QR-Code scannen": "Skano QR",
  "NFC-Tag scannen": "Skano NFC", "Scan erfolgreich": "Skanim i suksesshëm",
  "Scan fehlgeschlagen": "Skanimi dështoi", "Unbekannter Punkt": "Pikë e panjohur",
  "Eintrag löschen": "Fshi hyrjen", "Foto hinzufügen": "Shto foto", "Notiz": "Shënim",

  "Einstempeln": "Hyr në punë", "Ausstempeln": "Dil nga puna", "Aktive Schicht": "Turn aktiv",
  "Schicht läuft": "Turni në vazhdim", "Eingestempelt": "Në punë", "Ausgestempelt": "Jashtë pune",

  "Tägliche Erinnerung": "Kujtues ditor", "Erinnerung aktiv": "Kujtuesi aktiv",
  "Benachrichtigungen blockiert": "Njoftimet bllokuar",
};

const es: Dict = {
  "Menü": "Menú", "Meine Schichten": "Mis turnos", "Export (PDF / CSV)": "Exportar (PDF / CSV)",
  "Einstellungen": "Ajustes", "Heller Modus": "Modo claro", "Dunkler Modus": "Modo oscuro",
  "Abmelden": "Cerrar sesión", "Sprache": "Idioma", "Wachbuch": "Libro de guardia", "Abbrechen": "Cancelar",
  "Speichern": "Guardar", "Gespeichert": "Guardado", "Hinzufügen": "Añadir", "Löschen": "Eliminar",
  "Bearbeiten": "Editar", "Schließen": "Cerrar", "Bestätigen": "Confirmar", "Weiter": "Continuar",
  "Zurück": "Atrás", "Laden...": "Cargando...", "Suchen": "Buscar", "Filter": "Filtro",
  "Alle": "Todos", "Heute": "Hoy", "Gestern": "Ayer", "Diese Woche": "Esta semana",
  "Dieser Monat": "Este mes", "Letzter Monat": "Mes pasado", "Ja": "Sí", "Nein": "No",
  "Fehler": "Error", "Erfolgreich": "Éxito", "Ein Fehler ist aufgetreten.": "Se produjo un error.",

  "Willkommen zurück": "Bienvenido de nuevo", "Melde dich an, um fortzufahren": "Inicia sesión para continuar",
  "Passwort vergessen": "Contraseña olvidada", "Wir senden dir einen Link zum Zurücksetzen": "Te enviaremos un enlace de restablecimiento",
  "Anmelden": "Iniciar sesión", "Link senden": "Enviar enlace", "Passwort vergessen?": "¿Olvidaste tu contraseña?",
  "E-Mail": "Correo electrónico", "Passwort": "Contraseña",
  "Bitte E-Mail eingeben": "Introduce el correo", "Bitte Passwort eingeben": "Introduce la contraseña",
  "oder weiter mit": "o continúa con", "Zurück zur Anmeldung": "Volver al inicio de sesión",
  "Zugang nur auf Einladung. Bitte kontaktiere deinen Administrator.": "Acceso solo por invitación. Contacta a tu administrador.",
  "E-Mail oder Passwort ungültig.": "Correo o contraseña incorrectos.",
  "Bitte bestätige zuerst deine E-Mail.": "Confirma primero tu correo.",
  "Diese E-Mail ist bereits registriert.": "Este correo ya está registrado.",
  "Zu viele Versuche. Bitte später erneut.": "Demasiados intentos. Intenta más tarde.",
  "Willkommen zurück!": "¡Bienvenido de nuevo!", "E-Mail zum Zurücksetzen gesendet!": "¡Correo de restablecimiento enviado!",
  "Sicher & verschlüsselt": "Seguro y cifrado", "PDF Export": "Exportar PDF",
  "Arbeitszeit-Erfassung & Schichtplanung für dein Sicherheitsteam.": "Registro de horario y planificación de turnos para tu equipo de seguridad.",

  "SOS NOTRUF": "EMERGENCIA SOS", "Notruf auslösen?": "¿Activar emergencia?",
  "Kurze Nachricht (optional)": "Mensaje breve (opcional)", "Notruf senden": "Enviar emergencia",
  "Sende…": "Enviando…", "Notruf abgesendet": "Emergencia enviada",
  "Notruf fehlgeschlagen": "Error al enviar", "SOS-Notruf in der Nähe": "Alerta SOS cercana",

  "Annehmen": "Aceptar", "Ablehnen": "Rechazar", "Akzeptieren": "Aceptar",
  "Standort freigeben": "Compartir ubicación", "Standort freigegeben": "Ubicación compartida",
  "Freigabe erforderlich": "Se requiere consentimiento", "Geofence verlassen": "Fuera del área",
  "Wieder im Einsatzbereich": "De vuelta en el área", "Schicht angenommen": "Turno aceptado",
  "Schicht abgelehnt": "Turno rechazado", "Kannst du diese Schicht übernehmen?": "¿Puedes tomar este turno?",
  "Angenommen": "Aceptado", "Abgelehnt": "Rechazado", "Route": "Ruta",
  "Diese Schicht wurde vom Admin storniert.": "Este turno fue cancelado por el administrador.",
  "Live-Standort wird an deinen Admin gesendet. App geöffnet lassen.": "Se envía tu ubicación en vivo al administrador. Mantén la app abierta.",
  "Ablehnen – Stunden zählen nicht": "Rechazado – las horas no cuentan",
  "Standort blockiert": "Ubicación bloqueada", "GPS-Timeout – bitte erneut versuchen": "Tiempo de GPS agotado – reintenta",
  "Dieses Gerät unterstützt kein GPS": "Este dispositivo no soporta GPS",
  "Standort-Zugriff fehlgeschlagen": "Error de acceso a ubicación",
  "Standort-Freigabe aktiv – Live-Übertragung läuft": "Compartir ubicación activo – transmisión en vivo",
  "Stunden werden für diese Schicht nicht angerechnet": "Las horas no contarán para este turno",
  "Bitte zurück zum Einsatzort.": "Por favor, vuelve a la ubicación.",
  "Bitte zurück zum Einsatzort. Der Admin wurde über deinen Standort informiert.": "Vuelve a la ubicación. Se ha informado al administrador.",
  "Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden nicht angerechnet.": "Este turno requiere compartir ubicación. Sin ella las horas no cuentan.",
  "Reinigung": "Limpieza", "Security": "Seguridad",

  "Neuer Eintrag": "Nuevo registro", "Eintrag speichern": "Guardar registro", "Einträge speichern": "Guardar registros",
  "Eintrag gespeichert!": "¡Registro guardado!", "Datum": "Fecha", "Von": "Desde", "Bis": "Hasta",
  "Uhrzeit von": "Hora desde", "Uhrzeit bis": "Hora hasta", "Pause (Min.)": "Descanso (min)",
  "Abziehen": "Descontar", "Nicht abziehen": "No descontar", "Projekt": "Proyecto",
  "Kein Projekt": "Sin proyecto", "Ort": "Ubicación", "Tätigkeit": "Actividad",
  "Was hast du gemacht?": "¿Qué hiciste?", "Bitte alle Felder ausfüllen": "Completa todos los campos",
  "End-Datum muss nach Start-Datum liegen": "La fecha de fin debe ser posterior a la de inicio",
  "Maximal 60 Tage auf einmal": "Máximo 60 días a la vez",
  "Zeitraum (mehrere Tage)": "Rango (varios días)", "Einzelner Tag": "Un día",
  "z.B. Büro Berlin, Baustelle München...": "ej. Oficina Berlín, obra Múnich...",

  "Profilbild": "Foto de perfil", "Wöchentliche Soll-Stunden": "Horas semanales objetivo",
  "Projekte": "Proyectos", "Projektname": "Nombre del proyecto", "Kunde (optional)": "Cliente (opcional)",
  "Konto verknüpfen": "Vincular cuenta",
  "Verknüpfe Google oder Apple, um dich auch ohne Passwort anmelden zu können.": "Vincula Google o Apple para iniciar sesión sin contraseña.",
  "Google verknüpft": "Google vinculado", "Google verknüpfen": "Vincular Google",
  "Apple verknüpft": "Apple vinculado", "Apple verknüpfen": "Vincular Apple",
  "Verknüpfung fehlgeschlagen": "Vinculación fallida", "Projekt existiert bereits": "El proyecto ya existe",

  "Export": "Exportar", "Alle Einträge": "Todos los registros", "Bestimmter Monat": "Mes específico",
  "Zeitraum": "Rango de fechas", "{count} Einträge ausgewählt": "{count} registros seleccionados",
  "Keine Einträge im gewählten Zeitraum": "Sin registros en el rango seleccionado",
  "Export fehlgeschlagen": "Exportación fallida",

  "Einträge laden...": "Cargando registros...", "Keine Einträge": "Sin registros",
  "Ort oder Tätigkeit suchen…": "Buscar ubicación o actividad…",
  "Ort oder Tätigkeit suchen": "Buscar ubicación o actividad",
  "{count} Einträge gespeichert!": "¡{count} registros guardados!",

  "Meine Arbeit": "Mi trabajo", "Schicht-Einteilung": "Asignación de turnos",
  "Gesamt": "Total", "Stunden": "Horas", "Stunden gearbeitet": "Horas trabajadas",
  "Wochenstunden": "Horas semanales", "Überstunden": "Horas extra", "Ziel": "Objetivo",
  "Eintrag": "Registro", "Einträge": "Registros",

  "Patrouille": "Patrulla", "Punkt scannen": "Escanear punto", "QR-Code scannen": "Escanear QR",
  "NFC-Tag scannen": "Escanear NFC", "Scan erfolgreich": "Escaneo exitoso",
  "Scan fehlgeschlagen": "Escaneo fallido", "Unbekannter Punkt": "Punto desconocido",
  "Eintrag löschen": "Eliminar registro", "Foto hinzufügen": "Añadir foto", "Notiz": "Nota",

  "Einstempeln": "Fichar entrada", "Ausstempeln": "Fichar salida", "Aktive Schicht": "Turno activo",
  "Schicht läuft": "Turno en curso", "Eingestempelt": "Fichado", "Ausgestempelt": "Salida fichada",

  "Tägliche Erinnerung": "Recordatorio diario", "Erinnerung aktiv": "Recordatorio activo",
  "Benachrichtigungen blockiert": "Notificaciones bloqueadas",
};

const fr: Dict = {
  "Menü": "Menu", "Meine Schichten": "Mes services", "Export (PDF / CSV)": "Exporter (PDF / CSV)",
  "Einstellungen": "Paramètres", "Heller Modus": "Mode clair", "Dunkler Modus": "Mode sombre",
  "Abmelden": "Se déconnecter", "Sprache": "Langue", "Wachbuch": "Main courante", "Abbrechen": "Annuler",
  "Speichern": "Enregistrer", "Gespeichert": "Enregistré", "Hinzufügen": "Ajouter", "Löschen": "Supprimer",
  "Bearbeiten": "Modifier", "Schließen": "Fermer", "Bestätigen": "Confirmer", "Weiter": "Continuer",
  "Zurück": "Retour", "Laden...": "Chargement...", "Suchen": "Rechercher", "Filter": "Filtre",
  "Alle": "Tous", "Heute": "Aujourd'hui", "Gestern": "Hier", "Diese Woche": "Cette semaine",
  "Dieser Monat": "Ce mois", "Letzter Monat": "Mois dernier", "Ja": "Oui", "Nein": "Non",
  "Fehler": "Erreur", "Erfolgreich": "Succès", "Ein Fehler ist aufgetreten.": "Une erreur est survenue.",

  "Willkommen zurück": "Bon retour", "Melde dich an, um fortzufahren": "Connecte-toi pour continuer",
  "Passwort vergessen": "Mot de passe oublié", "Wir senden dir einen Link zum Zurücksetzen": "Nous t'enverrons un lien de réinitialisation",
  "Anmelden": "Se connecter", "Link senden": "Envoyer le lien", "Passwort vergessen?": "Mot de passe oublié ?",
  "E-Mail": "E-mail", "Passwort": "Mot de passe",
  "Bitte E-Mail eingeben": "Saisis ton e-mail", "Bitte Passwort eingeben": "Saisis ton mot de passe",
  "oder weiter mit": "ou continuer avec", "Zurück zur Anmeldung": "Retour à la connexion",
  "Zugang nur auf Einladung. Bitte kontaktiere deinen Administrator.": "Accès sur invitation uniquement. Contacte ton administrateur.",
  "E-Mail oder Passwort ungültig.": "E-mail ou mot de passe invalide.",
  "Bitte bestätige zuerst deine E-Mail.": "Confirme d'abord ton e-mail.",
  "Diese E-Mail ist bereits registriert.": "Cet e-mail est déjà enregistré.",
  "Zu viele Versuche. Bitte später erneut.": "Trop de tentatives. Réessaie plus tard.",
  "Willkommen zurück!": "Bon retour !", "E-Mail zum Zurücksetzen gesendet!": "E-mail de réinitialisation envoyé !",
  "Sicher & verschlüsselt": "Sécurisé et chiffré", "PDF Export": "Export PDF",
  "Arbeitszeit-Erfassung & Schichtplanung für dein Sicherheitsteam.": "Suivi du temps et planning pour ton équipe de sécurité.",

  "SOS NOTRUF": "URGENCE SOS", "Notruf auslösen?": "Déclencher l'urgence ?",
  "Kurze Nachricht (optional)": "Court message (facultatif)", "Notruf senden": "Envoyer l'urgence",
  "Sende…": "Envoi…", "Notruf abgesendet": "Urgence envoyée",
  "Notruf fehlgeschlagen": "Échec de l'envoi", "SOS-Notruf in der Nähe": "Alerte SOS à proximité",

  "Annehmen": "Accepter", "Ablehnen": "Refuser", "Akzeptieren": "Accepter",
  "Standort freigeben": "Partager la position", "Standort freigegeben": "Position partagée",
  "Freigabe erforderlich": "Consentement requis", "Geofence verlassen": "Hors zone",
  "Wieder im Einsatzbereich": "De retour dans la zone", "Schicht angenommen": "Service accepté",
  "Schicht abgelehnt": "Service refusé", "Kannst du diese Schicht übernehmen?": "Peux-tu prendre ce service ?",
  "Angenommen": "Accepté", "Abgelehnt": "Refusé", "Route": "Itinéraire",
  "Diese Schicht wurde vom Admin storniert.": "Ce service a été annulé par l'administrateur.",
  "Live-Standort wird an deinen Admin gesendet. App geöffnet lassen.": "Position en direct envoyée à l'administrateur. Garde l'app ouverte.",
  "Ablehnen – Stunden zählen nicht": "Refusé – les heures ne comptent pas",
  "Standort blockiert": "Position bloquée", "GPS-Timeout – bitte erneut versuchen": "Délai GPS dépassé – réessaie",
  "Dieses Gerät unterstützt kein GPS": "Cet appareil ne supporte pas le GPS",
  "Standort-Zugriff fehlgeschlagen": "Accès à la position échoué",
  "Standort-Freigabe aktiv – Live-Übertragung läuft": "Partage de position actif – diffusion en direct",
  "Stunden werden für diese Schicht nicht angerechnet": "Les heures ne compteront pas pour ce service",
  "Bitte zurück zum Einsatzort.": "Reviens au lieu de travail.",
  "Bitte zurück zum Einsatzort. Der Admin wurde über deinen Standort informiert.": "Reviens sur place. L'administrateur a été informé.",
  "Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden nicht angerechnet.": "Ce service nécessite le partage de position. Sans cela, les heures ne comptent pas.",
  "Reinigung": "Nettoyage", "Security": "Sécurité",

  "Neuer Eintrag": "Nouvelle entrée", "Eintrag speichern": "Enregistrer l'entrée", "Einträge speichern": "Enregistrer les entrées",
  "Eintrag gespeichert!": "Entrée enregistrée !", "Datum": "Date", "Von": "De", "Bis": "À",
  "Uhrzeit von": "Heure de", "Uhrzeit bis": "Heure à", "Pause (Min.)": "Pause (min)",
  "Abziehen": "Déduire", "Nicht abziehen": "Ne pas déduire", "Projekt": "Projet",
  "Kein Projekt": "Aucun projet", "Ort": "Lieu", "Tätigkeit": "Activité",
  "Was hast du gemacht?": "Qu'as-tu fait ?", "Bitte alle Felder ausfüllen": "Remplis tous les champs",
  "End-Datum muss nach Start-Datum liegen": "La date de fin doit être après celle de début",
  "Maximal 60 Tage auf einmal": "Maximum 60 jours à la fois",
  "Zeitraum (mehrere Tage)": "Période (plusieurs jours)", "Einzelner Tag": "Un seul jour",
  "z.B. Büro Berlin, Baustelle München...": "ex. Bureau Berlin, chantier Munich...",

  "Profilbild": "Photo de profil", "Wöchentliche Soll-Stunden": "Heures hebdomadaires cibles",
  "Projekte": "Projets", "Projektname": "Nom du projet", "Kunde (optional)": "Client (facultatif)",
  "Konto verknüpfen": "Lier le compte",
  "Verknüpfe Google oder Apple, um dich auch ohne Passwort anmelden zu können.": "Lie Google ou Apple pour te connecter sans mot de passe.",
  "Google verknüpft": "Google lié", "Google verknüpfen": "Lier Google",
  "Apple verknüpft": "Apple lié", "Apple verknüpfen": "Lier Apple",
  "Verknüpfung fehlgeschlagen": "Liaison échouée", "Projekt existiert bereits": "Le projet existe déjà",

  "Export": "Exporter", "Alle Einträge": "Toutes les entrées", "Bestimmter Monat": "Mois spécifique",
  "Zeitraum": "Période", "{count} Einträge ausgewählt": "{count} entrées sélectionnées",
  "Keine Einträge im gewählten Zeitraum": "Aucune entrée dans la période choisie",
  "Export fehlgeschlagen": "Échec de l'export",

  "Einträge laden...": "Chargement des entrées...", "Keine Einträge": "Aucune entrée",
  "Ort oder Tätigkeit suchen…": "Rechercher lieu ou activité…",
  "Ort oder Tätigkeit suchen": "Rechercher lieu ou activité",
  "{count} Einträge gespeichert!": "{count} entrées enregistrées !",

  "Meine Arbeit": "Mon travail", "Schicht-Einteilung": "Planning des services",
  "Gesamt": "Total", "Stunden": "Heures", "Stunden gearbeitet": "Heures travaillées",
  "Wochenstunden": "Heures hebdo", "Überstunden": "Heures supp.", "Ziel": "Cible",
  "Eintrag": "Entrée", "Einträge": "Entrées",

  "Patrouille": "Patrouille", "Punkt scannen": "Scanner le point", "QR-Code scannen": "Scanner QR",
  "NFC-Tag scannen": "Scanner NFC", "Scan erfolgreich": "Scan réussi",
  "Scan fehlgeschlagen": "Échec du scan", "Unbekannter Punkt": "Point inconnu",
  "Eintrag löschen": "Supprimer l'entrée", "Foto hinzufügen": "Ajouter photo", "Notiz": "Note",

  "Einstempeln": "Pointer entrée", "Ausstempeln": "Pointer sortie", "Aktive Schicht": "Service actif",
  "Schicht läuft": "Service en cours", "Eingestempelt": "Pointé", "Ausgestempelt": "Sorti",

  "Tägliche Erinnerung": "Rappel quotidien", "Erinnerung aktiv": "Rappel actif",
  "Benachrichtigungen blockiert": "Notifications bloquées",
};

const tr: Dict = {
  "Menü": "Menü", "Meine Schichten": "Vardiyalarım", "Export (PDF / CSV)": "Dışa aktar (PDF / CSV)",
  "Einstellungen": "Ayarlar", "Heller Modus": "Açık mod", "Dunkler Modus": "Koyu mod",
  "Abmelden": "Çıkış yap", "Sprache": "Dil", "Wachbuch": "Nöbet defteri", "Abbrechen": "İptal",
  "Speichern": "Kaydet", "Gespeichert": "Kaydedildi", "Hinzufügen": "Ekle", "Löschen": "Sil",
  "Bearbeiten": "Düzenle", "Schließen": "Kapat", "Bestätigen": "Onayla", "Weiter": "Devam",
  "Zurück": "Geri", "Laden...": "Yükleniyor...", "Suchen": "Ara", "Filter": "Filtre",
  "Alle": "Tümü", "Heute": "Bugün", "Gestern": "Dün", "Diese Woche": "Bu hafta",
  "Dieser Monat": "Bu ay", "Letzter Monat": "Geçen ay", "Ja": "Evet", "Nein": "Hayır",
  "Fehler": "Hata", "Erfolgreich": "Başarılı", "Ein Fehler ist aufgetreten.": "Bir hata oluştu.",

  "Willkommen zurück": "Tekrar hoş geldin", "Melde dich an, um fortzufahren": "Devam etmek için giriş yap",
  "Passwort vergessen": "Şifre unutuldu", "Wir senden dir einen Link zum Zurücksetzen": "Sıfırlama bağlantısı göndereceğiz",
  "Anmelden": "Giriş yap", "Link senden": "Bağlantı gönder", "Passwort vergessen?": "Şifreni mi unuttun?",
  "E-Mail": "E-posta", "Passwort": "Şifre",
  "Bitte E-Mail eingeben": "Lütfen e-posta gir", "Bitte Passwort eingeben": "Lütfen şifre gir",
  "oder weiter mit": "veya şununla devam et", "Zurück zur Anmeldung": "Girişe dön",
  "Zugang nur auf Einladung. Bitte kontaktiere deinen Administrator.": "Yalnızca davetle erişim. Lütfen yöneticinle iletişime geç.",
  "E-Mail oder Passwort ungültig.": "E-posta veya şifre geçersiz.",
  "Bitte bestätige zuerst deine E-Mail.": "Önce e-postanı onayla.",
  "Diese E-Mail ist bereits registriert.": "Bu e-posta zaten kayıtlı.",
  "Zu viele Versuche. Bitte später erneut.": "Çok fazla deneme. Daha sonra tekrar dene.",
  "Willkommen zurück!": "Tekrar hoş geldin!", "E-Mail zum Zurücksetzen gesendet!": "Sıfırlama e-postası gönderildi!",
  "Sicher & verschlüsselt": "Güvenli ve şifreli", "PDF Export": "PDF dışa aktar",
  "Arbeitszeit-Erfassung & Schichtplanung für dein Sicherheitsteam.": "Güvenlik ekibin için zaman takibi ve vardiya planı.",

  "SOS NOTRUF": "SOS ACİL DURUM", "Notruf auslösen?": "Acil durum tetiklensin mi?",
  "Kurze Nachricht (optional)": "Kısa mesaj (isteğe bağlı)", "Notruf senden": "Acil durum gönder",
  "Sende…": "Gönderiliyor…", "Notruf abgesendet": "Acil durum gönderildi",
  "Notruf fehlgeschlagen": "Gönderim başarısız", "SOS-Notruf in der Nähe": "Yakında SOS çağrısı",

  "Annehmen": "Kabul et", "Ablehnen": "Reddet", "Akzeptieren": "Kabul et",
  "Standort freigeben": "Konumu paylaş", "Standort freigegeben": "Konum paylaşıldı",
  "Freigabe erforderlich": "Onay gerekli", "Geofence verlassen": "Bölgeden çıkıldı",
  "Wieder im Einsatzbereich": "Bölgeye geri dönüldü", "Schicht angenommen": "Vardiya kabul edildi",
  "Schicht abgelehnt": "Vardiya reddedildi", "Kannst du diese Schicht übernehmen?": "Bu vardiyayı alabilir misin?",
  "Angenommen": "Kabul edildi", "Abgelehnt": "Reddedildi", "Route": "Rota",
  "Diese Schicht wurde vom Admin storniert.": "Bu vardiya yönetici tarafından iptal edildi.",
  "Live-Standort wird an deinen Admin gesendet. App geöffnet lassen.": "Canlı konum yöneticine gönderiliyor. Uygulamayı açık tut.",
  "Ablehnen – Stunden zählen nicht": "Reddedildi – saatler sayılmaz",
  "Standort blockiert": "Konum engellendi", "GPS-Timeout – bitte erneut versuchen": "GPS zaman aşımı – tekrar dene",
  "Dieses Gerät unterstützt kein GPS": "Bu cihaz GPS desteklemiyor",
  "Standort-Zugriff fehlgeschlagen": "Konum erişimi başarısız",
  "Standort-Freigabe aktiv – Live-Übertragung läuft": "Konum paylaşımı aktif – canlı yayın sürüyor",
  "Stunden werden für diese Schicht nicht angerechnet": "Bu vardiya için saatler sayılmaz",
  "Bitte zurück zum Einsatzort.": "Lütfen iş yerine dön.",
  "Bitte zurück zum Einsatzort. Der Admin wurde über deinen Standort informiert.": "Lütfen iş yerine dön. Yönetici konumun hakkında bilgilendirildi.",
  "Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden nicht angerechnet.": "Bu vardiya konum paylaşımı gerektirir. Paylaşım olmadan saatler sayılmaz.",
  "Reinigung": "Temizlik", "Security": "Güvenlik",

  "Neuer Eintrag": "Yeni kayıt", "Eintrag speichern": "Kaydı kaydet", "Einträge speichern": "Kayıtları kaydet",
  "Eintrag gespeichert!": "Kayıt kaydedildi!", "Datum": "Tarih", "Von": "Başlangıç", "Bis": "Bitiş",
  "Uhrzeit von": "Saat başlangıç", "Uhrzeit bis": "Saat bitiş", "Pause (Min.)": "Mola (dk)",
  "Abziehen": "Düş", "Nicht abziehen": "Düşme", "Projekt": "Proje",
  "Kein Projekt": "Proje yok", "Ort": "Konum", "Tätigkeit": "Aktivite",
  "Was hast du gemacht?": "Ne yaptın?", "Bitte alle Felder ausfüllen": "Tüm alanları doldur",
  "End-Datum muss nach Start-Datum liegen": "Bitiş tarihi başlangıçtan sonra olmalı",
  "Maximal 60 Tage auf einmal": "Tek seferde en fazla 60 gün",
  "Zeitraum (mehrere Tage)": "Aralık (birkaç gün)", "Einzelner Tag": "Tek gün",
  "z.B. Büro Berlin, Baustelle München...": "örn. Berlin ofisi, Münih şantiyesi...",

  "Profilbild": "Profil resmi", "Wöchentliche Soll-Stunden": "Haftalık hedef saat",
  "Projekte": "Projeler", "Projektname": "Proje adı", "Kunde (optional)": "Müşteri (isteğe bağlı)",
  "Konto verknüpfen": "Hesap bağla",
  "Verknüpfe Google oder Apple, um dich auch ohne Passwort anmelden zu können.": "Şifresiz giriş için Google veya Apple bağla.",
  "Google verknüpft": "Google bağlı", "Google verknüpfen": "Google'ı bağla",
  "Apple verknüpft": "Apple bağlı", "Apple verknüpfen": "Apple'ı bağla",
  "Verknüpfung fehlgeschlagen": "Bağlantı başarısız", "Projekt existiert bereits": "Proje zaten var",

  "Export": "Dışa aktar", "Alle Einträge": "Tüm kayıtlar", "Bestimmter Monat": "Belirli ay",
  "Zeitraum": "Tarih aralığı", "{count} Einträge ausgewählt": "{count} kayıt seçildi",
  "Keine Einträge im gewählten Zeitraum": "Seçili aralıkta kayıt yok",
  "Export fehlgeschlagen": "Dışa aktarma başarısız",

  "Einträge laden...": "Kayıtlar yükleniyor...", "Keine Einträge": "Kayıt yok",
  "Ort oder Tätigkeit suchen…": "Konum veya aktivite ara…",
  "Ort oder Tätigkeit suchen": "Konum veya aktivite ara",
  "{count} Einträge gespeichert!": "{count} kayıt kaydedildi!",

  "Meine Arbeit": "İşim", "Schicht-Einteilung": "Vardiya planı",
  "Gesamt": "Toplam", "Stunden": "Saat", "Stunden gearbeitet": "Çalışılan saat",
  "Wochenstunden": "Haftalık saat", "Überstunden": "Fazla mesai", "Ziel": "Hedef",
  "Eintrag": "Kayıt", "Einträge": "Kayıtlar",

  "Patrouille": "Devriye", "Punkt scannen": "Noktayı tara", "QR-Code scannen": "QR tara",
  "NFC-Tag scannen": "NFC tara", "Scan erfolgreich": "Tarama başarılı",
  "Scan fehlgeschlagen": "Tarama başarısız", "Unbekannter Punkt": "Bilinmeyen nokta",
  "Eintrag löschen": "Kaydı sil", "Foto hinzufügen": "Fotoğraf ekle", "Notiz": "Not",

  "Einstempeln": "Mesaiye başla", "Ausstempeln": "Mesaiyi bitir", "Aktive Schicht": "Aktif vardiya",
  "Schicht läuft": "Vardiya devam ediyor", "Eingestempelt": "Başladı", "Ausgestempelt": "Bitti",

  "Tägliche Erinnerung": "Günlük hatırlatma", "Erinnerung aktiv": "Hatırlatma aktif",
  "Benachrichtigungen blockiert": "Bildirimler engellendi",
};

const dict: Record<Exclude<Lang, "de">, Dict> = { en, ar, fa, sq, es, fr, tr };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx>({
  lang: "de",
  setLang: () => {},
  t: (k) => k,
});

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "de";
    const saved = localStorage.getItem("app_lang") as Lang | null;
    return saved && LANGUAGES.some((l) => l.code === saved) ? saved : "de";
  });

  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = meta?.rtl ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem("app_lang", l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const template = lang === "de" ? key : (dict[lang]?.[key] ?? key);
      return interpolate(template, params);
    },
    [lang]
  );

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export const useT = () => useContext(LanguageContext);

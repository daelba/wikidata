/*global jQuery, mediaWiki, OO, wikibase*/
/*!
 * merge.js - Script to merge Wikidata items
 * @authors User:Ebrahim, User:Ricordisamoa, User:Fomafix, User:Bene*, User:Petr Matas, User:Matěj Suchánek
 * @license CC-Zero
 */
// See also: MediaWiki:Gadget-EmptyDetect.js and MediaWiki:Gadget-RfDHelper.js

function showClaim (claim) {
    if (claim.mainsnak.datavalue.type === 'wikibase-entityid') {
        return claim.mainsnak.datavalue.value.id;
    }
    if (claim.mainsnak.datavalue.type === 'time') {
        value = claim.mainsnak.datavalue.value.time;
        return value.replace("T00:00:00Z", "");
    }
    if (claim.mainsnak.datavalue.type === 'quantity') {
        return claim.mainsnak.datavalue.value.amount;
    }
    if (['string', 'external-id'].includes(claim.mainsnak.datavalue.type)) {
        return claim.mainsnak.datavalue.value;
    }
};

function init($, mw, OO) {
	'use strict';
	var messages, entityId = mw.config.get('wbEntityId'), api = new mw.Api();

	messages = (function () {
		var translations = {
			en: {
				conflictMessage: 'A conflict detected on ',
				conflictWithMessage: 'with',
				createRedirect: 'Create a redirect',
				creatingRedirect: 'Creating redirect...',
				errorWhile: 'Error while "$1":',
				invalidInput: 'Currently only Qid/Lid is a valid input',
				loadMergeDestination: 'Load merge destination on success',
				loadingMergeDestination: 'Loading merge destination...',
				lowestEntityId: 'Always merge into the older entity (uncheck to merge into the "Merge with" entity)',
				merge: 'Merge',
				mergePendingNotification: 'Merge.js has been started.<br>Now you can focus your browser on the other entity.',
				mergeProcess: 'Process the merge now',
				mergeSummary: 'Append the following text to the auto-generated edit summary:',
				mergeThisEntity: 'Merge this entity',
				mergeWithInput: 'Merge with:',
				mergeWithProgress: 'Merge with...',
				mergeWizard: 'Merge Wizard',
				pleaseWait: 'Please wait...',
				postpone: 'Postpone',
				postponeTitle: 'Store this entity\'s id and postpone the merge',
				reportError: 'If you believe it\'s an error, please report it [[here]] with source and destination of merge.',
				selectForMerging: 'Select for merging',
				selectForMergingTitle: 'Remember this entity as the second one of the two entities to be merged',
				unwatchOption: 'Remove merged entity from your watchlist (if watched)',
				unwatching: 'Removing from watch list...'
			},
			ar: {
				conflictMessage: 'يوجد تعارض في ',
				conflictWithMessage: 'مع',
				createRedirect: 'إنشاء تحويلة',
				creatingRedirect: 'إنشاء تحويلة...',
				errorWhile: 'خطأ عند "$1":',
				invalidInput: 'معرف عنصر (Qid) أو معرف مفردة (Lid) فقط مسموح بهما',
				loadMergeDestination: 'فتح وجهة الدمج عند الإغلاق',
				loadingMergeDestination: 'تحميل وجهة الدمج...',
				lowestEntityId: 'دائما ادمج إلى المادة الأقدم (لا تعلم للدمج مع مادة "ادمج مع")',
				merge: 'دمج',
				mergePendingNotification: 'أداة الدمج تعمل.<br>يمكنك الآن الاطلاع على المادة الأخرى.',
				mergeProcess: 'ادمج الآن',
				mergeSummary: 'إلحاق النص التالي بالنص التلقائي للملخص :',
				mergeThisEntity: 'ادمج هذه المادة',
				mergeWithInput: 'ادمج مع:',
				mergeWithProgress: 'يدمج مع...',
				mergeWizard: 'أداة الدمج',
				pleaseWait: 'انتظار...',
				postpone: 'تأجيل',
				postponeTitle: 'خزن معرف هذه المادة وأجل الدمج',
				reportError: 'إذا كنت متأكد أن هذا خلل فنرجو التبليغ عنه [[هنا]] مع مصدر الدمج ووجهته.',
				selectForMerging: 'اختر للدمج',
				selectForMergingTitle: 'تذكر هذا العنصر ثاني عنصري الدمج',
				unwatchOption: 'حذف العنصر المدموج من قائمة المراقبة (إذا كان مراقبًا)',
				unwatching: 'يحذف من القائمة...'
			},
			be: {
				conflictMessage: 'Выяўлены канфлікт у ',
				conflictWithMessage: 'з',
				createRedirect: 'Стварыць перасылку',
				creatingRedirect: 'Стварэнне перасылкі…',
				errorWhile: 'Памылка падчас «$1»:',
				invalidInput: 'У цяперашні час можна пазначыць толькі Qid/Lid',
				loadMergeDestination: 'Пасля паспяховага завяршэння перайсці ў аб’яднаны элемент',
				loadingMergeDestination: 'Загрузка старонкі аб’яднанага элемента…',
				lowestEntityId: 'Заўсёды аб’ядноўваць у старэйшы элемент (прыбярыце галку, каб аб’яднаць у элемент, пазначаны ў полі «Аб’яднаць з»)',
				merge: 'Аб’яднаць',
				mergePendingNotification: 'Merge.js быў запушчаны.<br>Зараз вы можаце адкрыць іншы элемент у сваім браўзеры.',
				mergeProcess: 'Выканаць аб’яднанне зараз',
				mergeSummary: 'Дадаць да аўтаматычнага апісання праўкі:',
				mergeThisEntity: 'Аб’яднаць гэты элемент',
				mergeWithInput: 'Аб’яднаць з:',
				mergeWithProgress: 'Аб’яднаць з…',
				mergeWizard: 'Майстар аб’яднання',
				pleaseWait: 'Калі ласка, пачакайце…',
				postpone: 'Адкласці',
				postponeTitle: 'Захаваць ідэнтыфікатар гэтай сутнасці і адкласці аб’яднанне',
				reportError: 'Калі вы лічыце, што гэта памылка, калі ласка, паведаміце пра гэта [[тут]] з пазначэннем крыніцы і мэтавай старонкі аб’яднання.',
				selectForMerging: 'Выбраць для аб’яднання',
				selectForMergingTitle: 'Запомніць гэты элемент як другі з двух элементаў, якія мусяць аб’яднацца',
				unwatchOption: 'Выдаліць аб’яднаны элемент са спісу назірання (калі ён там прысутнічае)',
				unwatching: 'Выдаленне са спісу назірання…'
			},
			'be-tarask': {
				conflictMessage: 'Выяўлены канфлікт у ',
				conflictWithMessage: 'з',
				createRedirect: 'Стварыць перанакіраваньне',
				creatingRedirect: 'Стварэньне перанакіраваньня…',
				errorWhile: 'Памылка падчас „$1“:',
				invalidInput: 'Цяпері можна пазначаць толькі Qid/Lid',
				loadMergeDestination: 'Па сканчэньні загрузіць аб’яднаны элемэнт',
				loadingMergeDestination: 'Загружаецца аб’яднаны элемэнт…',
				lowestEntityId: 'Заўсёды аб’ядноўваць у старэйшы элемент (калі зьняць пазнаку, аб’яднаньне адбудзецца ў элемэнт «Аб’яднаць з»)',
				merge: 'Аб’яднаць',
				mergePendingNotification: 'Запушчаны Merge.js.<br>Зараз можаце адкрыць у браўзэры іншы элемэнт.',
				mergeProcess: 'Выканаць аб’яднаньне зараз',
				mergeSummary: 'Дадаць да аўтаматычнага апісаньня гэты тэкст:',
				mergeThisEntity: 'Аб’яднаць гэты элемэнт',
				mergeWithInput: 'Аб’яднаць з:',
				mergeWithProgress: 'Аб’яднаць з…',
				mergeWizard: 'Майстар аб’яднаньня',
				pleaseWait: 'Калі ласка, пачакайце…',
				postpone: 'Адкласьці',
				postponeTitle: 'Захаваць ідэнтыфікатар гэтай існасьці і адкласьці аб’яднаньне',
				reportError: 'Калі вы лічыце, што гэта памылка, калі ласка, паведамце пра гэта [[тут]] з пазначэньнем крыніцы і мэтавай старонкі.',
				selectForMerging: 'Выбраць для аб’яднаньня',
				selectForMergingTitle: 'Запомніць гэты элемэнт як другі з двух элемэнтаў да аб’яднаньня',
				unwatchOption: 'Выдаліць аб’яднаны элемэнт з сьпісу назірання (калі ўключаны)',
				unwatching: 'Выдаленьне з сьпісу назіраньня…'
			},
			bn: {
				conflictMessage: 'এতে দ্বন্দ্ব শনাক্ত হয়েছে ',
				conflictWithMessage: 'এর সাথে',
				createRedirect: 'পুনর্নির্দেশ তৈরি করুন',
				creatingRedirect: 'পুনর্নির্দেশ তৈরি করা হচ্ছে...',
				errorWhile: '"$1" করার সময় ত্রুটি:',
				invalidInput: 'বর্তমানে কেবল Qid/Lid হল বৈধ ইনপুট',
				loadMergeDestination: 'সফল হলে একত্রীকরণের গন্তব্য লোড করুন',
				loadingMergeDestination: 'একত্রীকরণের গন্তব্য লোড করা হচ্ছে...',
				lowestEntityId: 'সর্বদা পুরনো সত্তায় একত্রিত করুন ("এর সাথে একত্রিত করুন" সত্তার সাথে একত্রিত করতে এই টিকচিহ্ন সরান)',
				merge: 'একত্রিত করুন',
				mergePendingNotification: 'Merge.js শুরু হয়েছে।<br>আপনি এখন আপনার ব্রাউজারের অন্য সত্তায় নজর দিতে পারেন।',
				mergeProcess: 'এখনি একত্রিত করার প্রক্রিয়া শুরু করুন',
				mergeSummary: 'স্বতঃ উৎপাদিত সম্পাদনা সারাংশের শেষে এই লেখা যুক্ত করুন:',
				mergeThisEntity: 'এই সত্তাটি একত্রিত করুন',
				mergeWithInput: 'এর সাথে একত্রিত করুন:',
				mergeWithProgress: 'এর সাথে একত্রিত করুন...',
				mergeWizard: 'একত্রিত করুন',
				pleaseWait: 'দয়া করে অপেক্ষা করুন...',
				postpone: 'স্থগিত করুন',
				postponeTitle: 'এই সত্তার আইডি সঞ্চয় করুন ও একত্রীতকরণ স্থগিত করুন',
				reportError: 'আপনি যদি মনে করেন যে এটি একটি ত্রুটি, তবে দয়া করে [[এখানে]] উত্স ও একত্রিত করার গন্তব্যসহ প্রতিবেদন করুন।',
				selectForMerging: 'একত্রিত করার জন্য নির্বাচন করুন',
				selectForMergingTitle: 'একত্রিত করার জন্য এই সত্তাকে দুটি সত্তার দ্বিতীয়টি হিসেবে মনে রাখুন',
				unwatchOption: 'আপনার নজরতালিকা থেকে একত্রিত করা সত্তাটি সরান (যদি নজর রাখেন)',
				unwatching: 'নজরতালিকা থেকে সরানো হচ্ছে...'
			},
			cs: {
				conflictMessage: 'Detekován konflikt v ',
				conflictWithMessage: 's',
				createRedirect: 'Vytvořit přesměrování',
				creatingRedirect: 'Vytvářím přesměrování',
				errorWhile: 'Chyba při „$1“:',
				invalidInput: 'Platný vstup je zatím pouze identifikátor entity',
				loadMergeDestination: 'Po provedení načíst výsledek sloučení',
				loadingMergeDestination: 'Načítám výsledek sloučení...',
				lowestEntityId: 'Vždy sloučit do starší z entit (vypněte pro sloučení do entity uvedené v poli „Sloučit s“)',
				merge: 'Sloučit',
				mergePendingNotification: 'Skript Merge.js byl aktivován.<br>Nyní můžete ve svém prohlížeči přejít na jinou entitu.',
				mergeProcess: 'Provést nyní sloučení',
				mergeSummary: 'K automaticky generovanému shrnutí editace připojit tento text:',
				mergeThisEntity: 'Sloučit entitu',
				mergeWithInput: 'Sloučit s:',
				mergeWithProgress: 'Sloučit s...',
				mergeWizard: 'Nástroj pro slučování',
				pleaseWait: 'Prosím čekejte...',
				postpone: 'Odložit',
				postponeTitle: 'Uložit id entity a odložit sloučení',
				reportError: 'Pokud si myslíte, že je to chyba, prosíme nahlaste ji [[zde]] s původní a cílovou entitou ke sloučení.',
				selectForMerging: 'Vybrat ke sloučení',
				selectForMergingTitle: 'Zapamatovat si tuto entitu jako druhou ze dvou entit ke sloučení',
				unwatchOption: 'Odstranit vyprázdněnou entitu z vašich sledovaných stránek (je-li sledována)',
				unwatching: 'Odstraňuji ze sledovaných stránek...'
			},
			de: {
				conflictMessage: 'Ein Konflikt wurde erkannt bei ',
				conflictWithMessage: 'mit',
				createRedirect: 'Erstelle Weiterleitung',
				creatingRedirect: 'Erstelle Weiterleitung...',
				errorWhile: 'Fehler während „$1“:',
				invalidInput: 'Zurzeit sind lediglich Q-IDs bzw. L-IDs gültige Werte',
				loadingMergeDestination: 'Lade zusammengelegtes Datenelement…',
				loadMergeDestination: 'Lade Zieldatenobjekt der Zusammenlegung',
				lowestEntityId: 'Lege Daten in das ältere Datenobjekt zusammen (nicht anhaken, um in das unter "Zusamenlegen mit"-Datenobjekt zusammenzulegen)',
				merge: 'Zusammenlegen',
				mergePendingNotification: 'Merge.js wurde gestartet.<br>Jetzt kannst du das andere Datenelement öffnen.',
				mergeProcess: 'Starte das Zusammenlegen jetzt',
				mergeSummary: 'Hänge den folgenden Text an die automatisch generierte Zusammenfassungszeile an:',
				mergeThisEntity: 'Lege das Datenelement zusammen',
				mergeWithInput: 'Zusammenlegen mit:',
				mergeWithProgress: 'Zusammenlegen mit…',
				mergeWizard: 'Assistent zum Zusammenlegen',
				pleaseWait: 'Bitte warte…',
				postpone: 'Verschieben',
				postponeTitle: 'Speichere die Nummer des Datenelementes und mach es zum Ziel einer Zusammenlegung',
				//reportError: 'Bitte melde diesen Fehler [[hier]] mit Quelle und Ziel der Zusammenlegung.',
				selectForMerging: 'Zum Zusammenlegen auswählen',
				selectForMergingTitle: 'Merk Dir dieses Datenobjekt als zweites der zusammenzulegenden Datenobjekte',
				unwatchOption: 'Entferne zusammengelegte Datenelemente von der Beobachtungsliste (wenn beobachtet)',
				unwatching: 'Entferne von Beobachtungsliste…'
			},
			'de-formal': {
				mergePendingNotification: 'Merge.js wurde gestartet.<br>Jetzt können Sie das andere Datenelement öffnen.'
			},
			el: {
				conflictMessage: 'Ανιχνεύθηκε διένεξη',
				conflictWithMessage: 'με',
				createRedirect: 'Δημιουργία ανακατεύθυνσης',
				creatingRedirect: 'Δημιουργείται ανακατεύθυνση...',
				loadingMergeDestination: ' Ανανέωση σελίδας προς το αντικείμενο έγινε η συγχώνευση ...',
				lowestEntityId: 'Πάντα να γίνεται συγχώνευση στο παλαιότερο αντικείμενο (καταργήστε την επιλογή για να συγχωνευθεί με το αντικείμενο "Συγχώνευση με")',
				merge: 'Συγχώνευση',
				mergePendingNotification: 'Η εφαρμογή Merge.js ξεκίνησε.<br>Τώρα μπορείτε να εστιάσετε το πρόγραμμα περιήγησης στο άλλο αντικέιμενο.',
				mergeProcess: 'Άμεση συγχώνευση',
				mergeThisEntity: 'Συγχώνευση αυτού του αντικειμένου ',
				mergeWithInput: 'Συγχώνευση με:',
				mergeWithProgress: 'Συγχώνευση με...',
				mergeWizard: 'Οδηγός συγχώνευσης',
				pleaseWait: 'Παρακαλώ περιμένετε...',
				postpone: 'Αναβολή',
				postponeTitle: 'Αποθήκευση αυτού του κωδικού αντικειμένου/αντικειμένων και αναβολή της συγχώνευσης',
				selectForMerging: 'Επιλέξτε για συγχώνευση',
				selectForMergingTitle: 'Να θυμάσαι αυτό το αντικείμενο σαν το δεύτερο από τα δύο αντικείμενο που θα συγχωνευθούν',
				unwatchOption: 'Αφαιρέστε το συγχωνευμένο αντικείμενο από την σελίδα παρακολούθησής σας (εάν ήδη το παρακολουθείτε)',
				unwatching: 'Αφαίρεση από τη σελίδα παρακολούθησης...'
			},
			es: {
				conflictMessage: 'Un conflicto detectado en ',
				conflictWithMessage: 'con',
				createRedirect: 'Crear una redirección',
				creatingRedirect: 'Creando redirección...',
				errorWhile: 'Se ha producido un error en "$1":',
				invalidInput: 'Actualmente las únicas entradas válidas son los identificadores Q de los elementos',
				loadMergeDestination: 'Cargar el destino de la fusión al finalizar',
				loadingMergeDestination: 'Cargando el destino de la fusión...',
				lowestEntityId: 'Fusionar siempre en la entidad más antigua (desmarcar para fusionar en el elemento del campo «Fusionarlo con»)',
				merge: 'Fusionar',
				mergePendingNotification: 'Merge.js empezó.<br>Ahora puedes ir con tu navegador al otro elemento',
				mergeProcess: 'Proceder a la fusión ahora',
				mergeSummary: 'Añadir el siguiente texto al resumen de edición automático:',
				mergeThisEntity: 'Fusionar este elemento',
				mergeWithInput: 'Fusionarlo con:',
				mergeWithProgress: 'Fusionarlo con...',
				mergeWizard: 'Herramienta de fusión',
				pleaseWait: 'Por favor, espera...',
				postpone: 'Posponer',
				postponeTitle: 'Guardar el id de este elemento y posponer la fusión',
				reportError: 'Si consideras que fue un fallo, por favor, notifícalo [[aquí]] con el origen y el destino de la fusión.',
				selectForMerging: 'Seleccionar para fusión',
				selectForMergingTitle: 'Recordar este elemento como el segundo de los dos a fusionar',
				unwatchOption: 'Eliminar los elementos fusionados de tu lista de seguimiento (si están)',
				unwatching: 'Eliminando de la lista de seguimiento...'
			},
			fa: {
				conflictMessage: 'تداخل در ',
				conflictWithMessage: 'با',
				createRedirect: 'ایجاد یک تغییر مسیر',
				creatingRedirect: 'ایجاد تغییر مسیر…',
				loadingMergeDestination: 'بارگیری مقصد ادغام…',
				lowestEntityId: 'همیشه به آیتم قدیمی‌تر ادغام کن (برای خاموش کردن «ادغام کردن با» کنیک کنید)',
				merge: 'ادغام',
				mergePendingNotification: 'ابزار ادغام فعال شد<br>هم‌اکنون می‌توانید به صفحهٔ آیتم دیگر برای ادغام بروید.',
				mergeProcess: 'انجام دادن ادغام',
				mergeThisEntity: 'ادغام این آیتم',
				mergeWithInput: 'ادغام کردن با:',
				mergeWithProgress: 'ادغام کردن با…',
				mergeWizard: 'ابزار ادغام',
				pleaseWait: 'صبر کنید…',
				postpone: 'به تأخیر انداختن',
				postponeTitle: 'ذخیرهٔ شناسهٔ آیتم و به تاخیر انداختن ادغام',
				unwatchOption: 'حذف آیتم‌های ادغام شده از فهرست پی‌گیری‌ها',
				unwatching: 'حذف از پیگیری‌ها…'
			},
			fi: {
				conflictMessage: 'Ristiriita havaittu sivustolla ',
				conflictWithMessage: 'sivustolinkillä',
				createRedirect: 'Luo ohjaus',
				creatingRedirect: 'Luodaan ohjausta...',
				errorWhile: 'Virhe suorittaessa "$1":',
				invalidInput: 'Tällä hetkellä vain QID:t ja LID:t ovat kelvollisia syötteitä',
				loadMergeDestination: 'Siirry yhdistettyyn kohteeseen yhdistämisen onnistuttua',
				loadingMergeDestination: 'Ladataan yhdistettyä kohdetta...',
				lowestEntityId: 'Yhdistä aina vanhempaan kohteeseen (poista valinta yhdistääksesi "Yhdistä seuraavan kohteen kanssa" -kentän kohteeseen)',
				merge: 'Yhdistä',
				mergePendingNotification: 'Merge.js on käynnistetty.<br>Nyt voit siirtyä selaimessa toiseen kohteeseen.',
				mergeProcess: 'Yhdistä nyt',
				mergeSummary: 'Lisää seuraava teksti automaattiseen muokkausyhteenvetoon:',
				mergeThisEntity: 'Yhdistä tämä kohde',
				mergeWithInput: 'Yhdistä seuraavan kohteen kanssa:',
				mergeWithProgress: 'Yhdistä',
				mergeWizard: 'Ohjattu yhdistäminen',
				pleaseWait: 'Odota...',
				postpone: 'Lykkää',
				postponeTitle: 'Säilytä tämän kohteen ID ja lykkää yhdistämistä',
				reportError: 'Jos uskot, että kyseessä on virhe, ilmoita siitä [[täällä]]. Mainitse yhdistämistä tarvitsevat kohteet.',
				selectForMerging: 'Valitse yhdistettäväksi',
				selectForMergingTitle: 'Muista tämä kohde yhtenä kahdesta yhdistämistä tarvitsevasta kohteesta',
				unwatchOption: 'Poista yhdistetty kohde tarkkailulistaltasi (jos tarkkailtuna)',
				unwatching: 'Poistetaan tarkkailulistalta...'
			},
			fr: {
				conflictMessage: 'Un conflit a été détecté sur ',
				conflictWithMessage: 'avec',
				createRedirect: 'Créer une redirection',
				creatingRedirect: 'Création de la redirection ...',
				errorWhile: 'Erreur durant "$1" :',
				invalidInput: 'Actuellement, seul Qid est une entrée valide',
				loadMergeDestination: 'Charger la destination de fusion en cas de succès',
				loadingMergeDestination: 'Chargement de la destination de fusion ...',
				lowestEntityId: 'Toujours fusionner dans l’élément le plus vieux (décocher pour fusionner vers l’élément indiqué dans « Fusionner avec »)',
				merge: 'Fusionner',
				mergePendingNotification: 'Merge.js a commencé.<br>Vous pouvez maintenant consulter un autre élément.',
				mergeProcess: 'Procéder à la fusion maintenant',
				mergeSummary: 'Ajouter le texte suivant en tant que résumé de modification :',
				mergeThisEntity: 'Fusionner cet élément',
				mergeWithInput: 'Fusionner avec :',
				mergeWithProgress: 'Fusionner avec ...',
				mergeWizard: 'Outil de fusion',
				pleaseWait: 'Attendez ...',
				postpone: 'Repousser à plus tard',
				postponeTitle: 'Stocker cet identifiant et repousser à plus tard la fusion',
				//reportError: 'Rapportez l’erreur ci-dessus [[ici]] avec la source et la destination à fusionner.',
				selectForMerging: 'Selectionner pour une fusion',
				selectForMergingTitle: 'Rappeler cet élément comme le second parmi les deux éléments à fusionner',
				unwatchOption: 'Retirer les éléments supprimés de votre liste de suivi (s’ils étaient suivis)',
				unwatching: 'Retrait de la liste de suivi ...'
			},
			gl: {
				conflictMessage: 'Detectouse un conflito en ',
				conflictWithMessage: 'con',
				createRedirect: 'Crear unha redirección',
				creatingRedirect: 'Creando a redirección...',
				errorWhile: 'Produciuse un erro ao "$1":',
				invalidInput: 'Actualmente, as únicas entradas válidas son os identificadores Q dos elementos',
				loadMergeDestination: 'Cargar o destino da fusión ao rematar',
				loadingMergeDestination: 'Cargando o destino da fusión...',
				lowestEntityId: 'Fusionar sempre no elemento máis vello (desmarca a opción para fusionar no elemento do campo "Fusionar con")',
				merge: 'Fusionar',
				mergePendingNotification: 'Merge.js iniciouse.<br>Xa podes ir co navegador ao outro elemento.',
				mergeProcess: 'Proceder agora á fusión',
				mergeSummary: 'Engadir o seguinte texto ao resumo de edición automático:',
				mergeThisEntity: 'Fusionar este elemento',
				mergeWithInput: 'Fusionar con:',
				mergeWithProgress: 'Fusionar con...',
				mergeWizard: 'Ferramenta de fusións',
				pleaseWait: 'Por favor, espera...',
				postpone: 'Pospoñer',
				postponeTitle: 'Gardar o identificador deste elemento e pospor a fusión',
				//reportError: 'Informa do erro anterior [[aquí]] coa orixe e mais o destino da fusión.',
				selectForMerging: 'Seleccionar para a súa fusión',
				selectForMergingTitle: 'Lembrar este elemento como o segundo dos dous a fusionar',
				unwatchOption: 'Eliminar o elemento fusionado da túa lista de vixilancia (se está nela)',
				unwatching: 'Eliminando da lista de vixilancia...'
			},
			gu: {
				conflictMessage: 'પર એક અથડામણ મળેલ છે',
				conflictWithMessage: 'સાથે',
				loadingMergeDestination: 'વિલિન કરેલ લક્ષ્યાંક લાવાય રહ્યું છે...',
				lowestEntityId: 'Always merge into the older entity (uncheck to merge into the "તેને સાથે વિલિન કરો" entity)',
				merge: 'વિલીનMerge',
				mergePendingNotification: 'Merge.js શરૂ થઈ ગયેલ છે.<br> હવે તમે તમારું બ્રાઉઝર અન્ય લેખ પર કેન્દ્રિત કરી શકો છો.',
				mergeProcess: 'હમણા જ વિલિનીકરણની પ્રક્રિયા કરો કરો',
				mergeThisEntity: 'આ લેખ વિલિન કરો',
				mergeWithInput: 'તેને સાથે વિલિન કરો:',
				mergeWithProgress: 'તેને સાથે વિલિન કરો...',
				mergeWizard: 'વિલિન વિઝાર્ડ',
				pleaseWait: 'મહેરબાની કરીને રાહ જુઓ...',
				postpone: 'મુલતવી રાખોPostpone',
				postponeTitle: 'આ લેખની ઓળખ સાચવો અને વિલિનીકરણ મુલતવી રાખો',
				unwatchOption: 'વિલિન કરેલ લેખો તમારી ધ્યાનસૂચિમાંથી હટાવો (જો ધ્યાનસૂચિમાં હોય તો)',
				unwatching: 'ધ્યાનસૂચિમાંથી હટાવાય રહ્યું છે...'
			},
			hr: {
				conflictMessage: 'Otkriven je sukob ',
				conflictWithMessage: 's',
				createRedirect: 'Napravi preusmjeravanje',
				creatingRedirect: 'Stvaram preusmjeravanje...',
				errorWhile: 'Pogrješka za vrijeme "$1":',
				invalidInput: 'Trenutačno se može unijeti samo Qid',
				loadMergeDestination: 'Po završetku učitaj završnu stavku',
				loadingMergeDestination: 'Učitavam završnu stavku...',
				lowestEntityId: 'Uvijek spoji sa starijom stavkom (odznačite ako želite spojiti sa stavkom navedenom u polju "Spoji s")',
				merge: 'Spoji',
				mergePendingNotification: 'Merge.js je pokrenut.<br>Možete nastaviti raditi na drugim stavkama.',
				mergeProcess: 'Spoji stavku sada',
				mergeSummary: 'Automatski stvorenom sažetku uređivanja dodaj sljedeći tekst :',
				mergeThisEntity: 'Spoji ovu stavku',
				mergeWithInput: 'Spoji s:',
				mergeWithProgress: 'Spoji s...', 
				mergeWizard: 'Čarobnjak za spajanje',
				pleaseWait: 'Molimo pričekajte...',
				postpone: 'Spoji kasnije',
				postponeTitle: 'Spremi ovu stavku i spoji kasnije',
				//reportError: 'Molimo prijavite gornju pogrješku [[ovdje]] s početnom i završnom stavkom spajanja.',
				selectForMerging: 'Označi za spajanje',
				selectForMergingTitle: 'Upamti ovu stavku kao drugu od dvije za spajanje',
				unwatchOption: 'Ukloni spojenu stavku s popisa praćenja (ako je bila na njemu)',
				unwatching: 'Uklanjam s popisa praćenja...'
			},
			hu: {
				conflictMessage: 'Ütközés észlelve ezen: ',
				conflictWithMessage: 'ezzel:',
				createRedirect: 'Átirányítás létrehozása',
				creatingRedirect: 'Átirányítás létrehozása…',
				errorWhile: 'Hiba miközben „$1”:',
				invalidInput: 'Jelenleg csak a Wikidata-azonosító (Qid) elfogadott érték',
				loadMergeDestination: 'Célelem betöltése sikeres összevonás esetén',
				loadingMergeDestination: 'Összevonás céljának betöltése…',
				lowestEntityId: 'Mindig a régebbi elembe vonjon össze (ajánlott; ha kiveszed a pipát, az „Összevonás a következővel”-nél megjelölt elembe von össze)',
				merge: 'Összevonás',
				mergePendingNotification: 'A Merge.js elindult.<br>Most menj a böngésződdel a másik elemre!',
				mergeProcess: 'Összevonás indítása',
				mergeSummary: 'Az automatikusan generált összefoglaló kiegészítése a következő szöveggel:',
				mergeThisEntity: 'Elem összevonása',
				mergeWithInput: 'Összevonás a következővel:',
				mergeWithProgress: 'Összevonás…',
				mergeWizard: 'Összevonás-varázsló',
				pleaseWait: 'Kérjük, várj…',
				postpone: 'Később',
				postponeTitle: 'Elem azonosítójának megjegyzése, és az összevonás elhalasztása',
				reportError: 'Ha úgy gondolod, hogy ez a varázsló hibája, kérjük, jelezd [[itt]] a forrás- és a célelemmel együtt!',
				selectForMerging: 'Kiválasztás összevonáshoz',
				selectForMergingTitle: 'Elem megjegyzése mint második a két összevonandó elemből',
				unwatchOption: 'Összevont elem eltávolítása a figyelőlistádról (ha figyeled)',
				unwatching: 'Eltávolítás a figyelőlistádról…'
			},
			id: {
				conflictMessage: 'Ada konflik terdeteksi pada ',
				conflictWithMessage: 'dengan',
				createRedirect: 'Buat halaman pengalihan',
				creatingRedirect: 'Membuat halaman pengalihan...',
				errorWhile: 'Galat pada "$1":',
				invalidInput: 'Saat ini, isian yang valid hanya bisa berupa QID atau LID',
				loadMergeDestination: 'Buka halaman tujuan setelah penggabungan berhasil',
				loadingMergeDestination: 'Membuka halaman tujuan penggabungan...',
				lowestEntityId: 'Gabung ke salah satu butir yang lebih tua',
				merge: 'Gabung',
				mergePendingNotification: 'Skrip telah dinyalakan.<br>Sekarang Anda dapat berfokus pada butir lain.',
				mergeProcess: 'Lakukan penggabungan',
				mergeSummary: 'Tambahkan teks berikut pada ringkasan suntingan:',
				mergeThisEntity: 'Gabungkan butir ini',
				mergeWithInput: 'Gabung dengan:',
				mergeWithProgress: 'Gabungkan',
				mergeWizard: 'Peralatan penggabungan',
				pleaseWait: 'Mohon tunggu...',
				postpone: 'Tunda',
				postponeTitle: 'Simpan butir dan tunda penggabungan',
				reportError: 'Jika Anda mencurigai bahwa telah terjadi galat, silakan laporkan ke sini dengan menyertakan QID atau LID asal dan tujuan penggabungan.',
				selectForMerging: 'Pilih untuk digabungkan sekaligus',
				selectForMergingTitle: 'Ingat butir ini sebagai butir kedua dari dua butir yang hendak digabung',
				unwatchOption: 'Hapus butir yang digabung dari daftar pantauan (jika ada)',
				unwatching: 'Menghapus dari daftar pantauan...'
		 },
			it: {
				conflictMessage: 'Rilevato un conflitto in ',
				conflictWithMessage: 'con',
				createRedirect: 'Crea un redirect',
				creatingRedirect: 'Creazione del redirect...',
				errorWhile: 'Errore durante "$1":',
				invalidInput: 'Attualmente solo Qid è un input valido',
				loadMergeDestination: 'Carica la destinazione dell\'unione in caso di successo',
				loadingMergeDestination: 'Caricamento della destinazione...',
				lowestEntityId: 'Unisci sempre nell\'elemento più vecchio (deselezione per unire nell\'elemento "Unisci con")',
				merge: 'Unione',
				mergePendingNotification: 'Merge.js è stato avviato.<br>Adesso vai sulla pagina dell\'altro elemento.',
				mergeProcess: 'Effettua l\'unione adesso',
				mergeSummary: 'Aggiungi il seguente testo all\'oggetto della modifica auto-generato:',
				mergeThisEntity: 'Unisci questo elemento',
				mergeWithInput: 'Unisci con:',
				mergeWithProgress: 'Unione con l\'elemento...',
				mergeWizard: 'Unione guidata',
				pleaseWait: 'Attendi...',
				postpone: 'Rimanda a dopo',
				postponeTitle: 'Memorizza l\'ID di questo elemento e rimanda a dopo l\'unione',
				//reportError: 'Riporta l\'errore sopra [[qui]] con l\'elemento di origine e destinazione dell\'unione.',
				selectForMerging: 'Seleziona per l\'unione',
				selectForMergingTitle: 'Ricorda questo elemento come il secondo dei due elementi da unire',
				unwatchOption: 'Rimuovi gli elementi uniti dagli osservati speciali (se presenti)',
				unwatching: 'Rimozione dagli osservati speciali...'
			},
			ja: {
				conflictMessage: '衝突が検出されました: ',
				conflictWithMessage: 'と',
				loadingMergeDestination: '統合先の読込中...',
				lowestEntityId: 'Always merge into the older entity (uncheck to merge into the "統合相手" entity)',
				merge: '統合',
				mergePendingNotification: 'Merge.js が動き出しました。<br>もうブラウザで他の項目に切り替えても大丈夫です。',
				mergeProcess: '統合をいま実行します',
				mergeThisEntity: 'この項目を統合する',
				mergeWithInput: '統合相手:',
				mergeWithProgress: '2つの項目を統合',
				mergeWizard: '統合ウィザード',
				pleaseWait: 'お待ちください...',
				postpone: '延期',
				postponeTitle: 'この項目のIDを保存し、統合を延期します',
				unwatchOption: '統合された項目をウォッチリストから除去する（ウォッチリストにある場合）',
				unwatching: 'ウォッチリストからの除去中...'
			},
			ko: {
				conflictMessage: '항목 충돌 감지됨: ',
				conflictWithMessage: '와',
				createRedirect: '넘겨주기를 만들기',
				creatingRedirect: '넘겨주기 생성중...',
				loadingMergeDestination: '병합한 내용을 불러오는 중입니다...',
				lowestEntityId: 'Always merge into the older entity (uncheck to merge into the "이 항목과 병합할 다른 항목" entity)',
				merge: '병합',
				mergePendingNotification: 'Merge.js 가 시작되었습니다.<br>이제 다른 작업을 하셔도 됩니다.',
				mergeProcess: '병합을 시작합니다.',
				mergeThisEntity: '이 항목을 병합',
				mergeWithInput: '이 항목과 병합할 다른 항목:',
				mergeWithProgress: '항목 병합 마법사',
				mergeWizard: '항목 병합 마법사',
				pleaseWait: '잠시만 기다리세요...',
				postpone: '연기',
				postponeTitle: '항목 번호 \'를 기억하고 병합을 일시 정지',
				unwatchOption: '주시문서 목록에서 제거합니다 (주시중인 문서일 경우)',
				unwatching: '주시문서 목록에서 제거중...'
			},
			lb: {
				conflictMessage: 'Et gouf e Konflikt fonnt op ',
				conflictWithMessage: 'mat',
				createRedirect: 'Eng Viruleedung uleeën ',
				creatingRedirect: 'Eng Viruleedung gëtt ugeluecht...',
				errorWhile: 'Feeler bei "$1":',
				invalidInput: 'Aktuell ass nëmme d\'Qid e valabele Wäert.',
				loadMergeDestination: 'D\'Zilsäit vun der Fusioun luede wann et funktionéiert',
				loadingMergeDestination: 'D\'Zilsäit vun der Fusioun gëtt gelueden...',
				lowestEntityId: 'Ëmmer an dat méi aalt Element fusionéieren (net uklicke fir et an d\'Element "Fusionéiert et mat" ze fusionéieren)',
				merge: 'Fusionéieren',
				mergePendingNotification: 'Merge.js gouf gestart. Elo kënnt Dir Iech an Ärem Browser op dat anert Element konzentréieren.',
				mergeProcess: 'Maacht d\'Fusioun elo',
				mergeSummary: 'Setzt dësen Text hannert den automatesch generéierte Resumé vun der Ännerung derbäi:',
				mergeThisEntity: 'Fusionéiert dëst Element',
				mergeWithInput: 'Fusionéiert et mat:',
				mergeWithProgress: 'Fusionéiert et mat...',
				mergeWizard: 'Fusiouns-Wizard',
				pleaseWait: 'Waart w.e.g....',
				postpone: 'Spéider maachen',
				postponeTitle: 'Dësem Element seng Nummer verhalen an d\'Fusioun op méi spéit verleeën',
				//reportError: 'Mellt de Feeler hei driwwer w.e.g. [[hei]] mat der Quell an dem Zil vun der Fusioun.',
				selectForMerging: 'Eraussiche fir ze fusionéieren',
				selectForMergingTitle: 'Dëst Element verhalen als dat zweet vun den Elementer déi fusionéiert gi sollen',
				unwatchOption: 'Fusionéiert Elementer vun Ärer Iwwerwaachungslëscht erofhuelen (wa se iwwerwaacht sinn)',
				unwatching: 'Vun der Iwwerwaachungslëscht erofhuelen...'
			},
			min: {
				conflictMessage: 'Ado konflik tadeteksi pado ',
				conflictWithMessage: 'jo',
				loadingMergeDestination: 'Loading tujuan panggabuangan...',
				lowestEntityId: 'Always merge into the older entity (uncheck to merge into the "Gabuang jo" entity)',
				merge: 'Gabuang',
				mergePendingNotification: 'Merge.js dimulai.<br>Kini Sanak dapek fokus pado item lain.',
				mergeProcess: 'Lakukan panggabuangan',
				mergeThisEntity: 'Gabuangkan item ko',
				mergeWithInput: 'Gabuang jo:',
				mergeWithProgress: 'Gabuangkan',
				mergeWizard: 'Pakakeh panggabuangan',
				pleaseWait: 'Mohon tunggu sabanta...',
				postpone: 'Tunda',
				postponeTitle: 'Simpan item dan tunda panggabuangan',
				unwatchOption: 'Hapuih item nan digabuang dari pantauan (kok ado)',
				unwatching: 'Hapuih dari daftar pantauan...'
			},
			mk: {
				conflictMessage: 'Утврдена спротиставеност во ',
				conflictWithMessage: 'со',
				createRedirect: 'Направи пренасочување',
				creatingRedirect: 'Правам пренасочување...',
				errorWhile: 'Грешка при „$1“:',
				invalidInput: 'Во мигов може да се внесе само Qid',
				loadMergeDestination: 'Вчитај ја целната страница при успешно спојување',
				loadingMergeDestination: 'Ја вчитувам целната страница на спојувањето...',
				lowestEntityId: 'Секогаш припојувај кон постариот предмет (отштиклирајте за да припоите во предметот „Спој со“)',
				merge: 'Спој',
				mergePendingNotification: 'Merge.js е започнат.<br>Сега можете да го отворите другиот предмет.',
				mergeProcess: 'Спроведи го спојувањето сега',
				mergeSummary: 'Придодај го следниов текст кон самосоздадениот опис на дејството:',
				mergeThisEntity: 'Спој го предметов',
				mergeWithInput: 'Спој со:',
				mergeWithProgress: 'Спој со...',
				mergeWizard: 'Спојувач',
				pleaseWait: 'Почекајте...',
				postpone: 'Одложи',
				postponeTitle: 'Зачувај ги предметните назнаки и одложи го спојувањето',
				//reportError: 'Пријавете ја грешката [[тука]] со изворната и целната страница на спојувањето.',
				selectForMerging: 'Избери за спојување',
				selectForMergingTitle: 'Запомни го предметов како втор од двата што се спојуваат',
				unwatchOption: 'Отстрани ја споената страница од набљудуваните (ако е таму)',
				unwatching: 'Отстранувам од набљудуваните...'
			},
			nb: {
				conflictMessage: 'En konflikt ble oppdaget i ',
				conflictWithMessage: 'med',
				createRedirect: 'Opprett omdirigering',
				creatingRedirect: 'Oppretter omdirigering...',
				errorWhile: 'Feil mens «$1»:',
				invalidInput: 'Kun Qid er gyldig innputt for øyeblikket',
				loadingMergeDestination: 'Laster flettemål...',
				lowestEntityId: 'Flett alltid inn i det gamle elementet (fjern merking for å flette til elementet i «Flett med»)',
				merge: 'Flett',
				mergePendingNotification: 'Merge.js har startet.<br>Du kan nå endre vindu til det andre elementet.',
				mergeProcess: 'Gjennomfør flettingen nå',
				mergeSummary: 'Legg til følgende tekst til det automatiske redigeringssammendraget:',
				mergeThisEntity: 'Flett elementet',
				mergeWithInput: 'Flett med:',
				mergeWithProgress: 'Flett med...',
				mergeWizard: 'Fletteveileder',
				pleaseWait: 'Vent...',
				postpone: 'Utsett',
				postponeTitle: 'Lagre elementets ID og utsett flettingen',
				//reportError: 'Rapporter feilen ovenfor [[her]] med kilde og mål for flettingen.',
				selectForMerging: 'Velg for fletting',
				selectForMergingTitle: 'Husk dette elementet som element nr. 2 av de som skal flettes',
				unwatchOption: 'Fjern flettet element fra overvåkningslista di',
				unwatching: 'Fjerner fra overvåkningsliste...'
			},
			nl: {
				conflictMessage: 'Een conflict werd gedetecteerd op ',
				conflictWithMessage: 'met',
				createRedirect: 'Maak een redirect aan',
				creatingRedirect: 'Redirect wordt aangemaakt...',
				errorWhile: 'Fout tijdens "$1":',
				invalidInput: 'Op dit moment kan alleen een Q-id worden opgegeven',
				loadMergeDestination: 'Bestemmingspagina van samenvoeging laden',
				loadingMergeDestination: 'Bestemmingspagina samenvoeging aan het laden...',
				lowestEntityId: 'Altijd samenvoegen naar het oudste item (het vinkje weghalen indien je samen wilt voegen naar het "Samenvoegen met"-item)',
				merge: 'Samenvoegen',
				mergePendingNotification: 'Merge.js is gestart.<br>Nu kunt u zich focussen op het andere item.',
				mergeProcess: 'Samenvoeging nu uitvoeren',
				mergeSummary: 'Voeg de volgende tekst toe aan de automatisch gegenereerde bewerkingssamenvatting:',
				mergeThisEntity: 'Dit item samenvoegen',
				mergeWithInput: 'Samenvoegen met:',
				mergeWithProgress: 'Samenvoegen',
				mergeWizard: 'Samenvoegingsassistent',
				pleaseWait: 'Even wachten...',
				postpone: 'Uitstellen',
				postponeTitle: 'Sla het id van het item op en stel de samenvoeging uit',
				//reportError: 'Rapporteer bovenstaande foutmelding [[hier]] met de oorsprong en bestemming van de samenvoeging.',
				selectForMerging: 'Selecteer voor samenvoegen',
				selectForMergingTitle: 'Onthoud dit item als de tweede van de twee items die samengevoegd moeten gaan worden',
				unwatchOption: 'Verwijder samengevoegde items van volglijst (als deze erop staan)',
				unwatching: 'Verwijderen van volglijst...'
			},
			pl: {
				conflictMessage: 'Wykryto konflikt ',
				conflictWithMessage: 'z',
				createRedirect: 'Utwórz przekierowanie',
				creatingRedirect: 'Tworzenie przekierowania...',
				loadingMergeDestination: 'Ładowanie łączonego elementu...',
				loadMergeDestination: 'Załaduj połączony element',
				lowestEntityId: 'Zawsze łącz ze starszym elementem',
				merge: 'Połącz',
				mergePendingNotification: 'Merge.js zostało uruchomione.<br>Możesz teraz przejść do innego elementu.',
				mergeProcess: 'Rozpocznij proces łączenia',
				mergeThisEntity: 'Połącz ten element',
				mergeWithInput: 'Połącz z elementem:',
				mergeWithProgress: 'Łączę z...',
				mergeWizard: 'Kreator łączenia',
				pleaseWait: 'Czekaj...',
				postpone: 'Odłóż na później',
				postponeTitle: 'Zapamiętaj identyfikator tego elementu i odłóż łączenie na później',
				selectForMerging: 'Zaznacz do połączenia',
				selectForMergingTitle: 'Zapamiętaj ten element jako drugi do połączenia dwóch elementów',
				unwatchOption: 'Usuń łączone elementy z mojej listy obserwowanych (jeśli na niej były)',
				unwatching: 'Usuwanie z listy obserwowanych...'
			},
			'pt-br': {
				conflictMessage: 'Um conflito detectado em ',
				conflictWithMessage: 'com',
				createRedirect: 'Criar um redirecionamento',
				creatingRedirect: 'Criando um redirecionamento...',
				errorWhile: 'Erro enquanto "$1":',
				invalidInput: 'Atualmente somente Qid é uma entrada válida',
				loadingMergeDestination: 'Carregando o destino da fusão...',
				lowestEntityId: 'Sempre faça a fusão no item mais antigo (desmarque para fundir no item "Fundir com")',
				merge: 'Fundir',
				mergePendingNotification: 'Merge.js foi iniciado.<br>Agora você pode focar o seu navegador no outro item.',
				mergeProcess: 'Processar a fusão agora',
				mergeSummary: 'Acrescentar o seguinte texto ao sumário de edição gerado automaticamente:',
				mergeThisEntity: 'Fundir este item',
				mergeWithInput: 'Fundir com:',
				mergeWithProgress: 'Fundir com...',
				mergeWizard: 'Assistente de fusões',
				pleaseWait: 'Por favor espere...',
				postpone: 'Adiar',
				postponeTitle: 'Armazenar o identificador deste item e adiar a fusão',
				//reportError: 'Favor reportar sobre o erro [[aqui]] com fonte e destinação da fusão.',
				selectForMerging: 'Selecionar para fusão',
				selectForMergingTitle: 'Memorizar esse item como o segundo de dois itens a serem fundidos',
				unwatchOption: 'Remover item fundido de sua lista de páginas vigiadas (se estiver vigiando)',
				unwatching: 'Removendo da lista de páginas vigiadas...'
			},
			ru: {
				conflictMessage: 'Обнаружен конфликт в ',
				conflictWithMessage: 'с',
				createRedirect: 'Создать перенаправление',
				creatingRedirect: 'Создаём перенаправление…',
				errorWhile: 'Ошибка во время «$1»:',
				invalidInput: 'В данный момент можно указать только Qid/Lid',
				loadMergeDestination: 'После успешного завершения перейти в объединённый элемент',
				loadingMergeDestination: 'Загрузка страницы объединённого элемента…',
				lowestEntityId: 'Всегда объединять в более старый элемент (уберите галочку, чтобы объединить в элемент, указанный в поле «Объединить с»)',
				merge: 'Объединить',
				mergePendingNotification: 'Merge.js был запущен.<br>Теперь вы можете открыть другой элемент в своём браузере.',
				mergeProcess: 'Выполнить объединение сейчас',
				mergeSummary: 'Добавить к автоматическому описанию правки:',
				mergeThisEntity: 'Объединить этот элемент',
				mergeWithInput: 'Объединить с:',
				mergeWithProgress: 'Объединить с…',
				mergeWizard: 'Мастер объединения',
				pleaseWait: 'Подождите, пожалуйста…',
				postpone: 'Отложить',
				postponeTitle: 'Сохранить идентификатор этой сущности и отложить слияние',
				reportError: 'Если вы считаете, что это ошибка, пожалуйста, сообщите об этом [[здесь]] с указанием источника и целевой страницы объединения.',
				selectForMerging: 'Выбрать для объединения',
				selectForMergingTitle: 'Запомнить этот элемент как второй из двух элементов, подлежащих объединению',
				unwatchOption: 'Удалить объединенный элемент из списка наблюдения (если он там присутствует)',
				unwatching: 'Удаляем из списка наблюдения…'
			},
			sl: {
				conflictMessage: 'Zaznano navzkrižje na ',
				conflictWithMessage: 'z/s',
				createRedirect: 'Ustvari preusmeritev',
				creatingRedirect: 'Ustvarjanje preusmeritve ...',
				errorWhile: 'Napaka med »$1«:',
				invalidInput: 'Trenutno je veljaven vnos samo Qid/Lid',
				loadMergeDestination: 'Ob uspehu naloži cilj združevanja',
				loadingMergeDestination: 'Nalaganje cilja združevanja ...',
				lowestEntityId: 'Vedno združi v starejšo entiteto (za združitev v entiteto »združi z« to odkljukajte)',
				merge: 'Združi',
				mergePendingNotification: 'Merge.js se je zagnal.<br>Zdaj lahko svoj brskalnik osredotočite na drugo entiteto.',
				mergeProcess: 'Obdelaj združevanje zdaj',
				mergeSummary: 'Samodejno ustvarjenemu povzetku urejanja pripni naslednje besedilo:',
				mergeThisEntity: 'Združi to entiteto',
				mergeWithInput: 'Združi z:',
				mergeWithProgress: 'Združi z ...',
				mergeWizard: 'Čarovnik za združevanje',
				pleaseWait: 'Prosimo, počakajte ...',
				postpone: 'Odloži',
				postponeTitle: 'Shrani ID te entitete in odloži združevanje',
				reportError: 'Če menite, da je prišlo do napake, jo z virom in ciljem združevanja sporočite [[tukaj]].',
				selectForMerging: 'Izberite za združevanje',
				selectForMergingTitle: 'To entiteto si zapomni kot drugo od dveh entitet za združitev',
				unwatchOption: 'Odstrani združeno entiteto s spiska nadzorov (če je opazovana)',
				unwatching: 'Odstranjujem s spiska nadzorov ...'
			},
			sk: {
				conflictMessage: 'Detekovaný konflikt v ',
				conflictWithMessage: 's',
				createRedirect: 'Vytvoriť presmerovanie',
				creatingRedirect: 'Vytváram presmerovanie',
				loadingMergeDestination : 'Načítam výsledok spojenia...',
				lowestEntityId: 'Always merge into the older entity (uncheck to merge into the "Spojiť s" entity)',
				merge: 'Spojiť',
				mergePendingNotification: 'Skript Merge.js bol aktivovaný.<br>Teraz môžete vo vašom prehliadači prejsť na inú položku.',
				mergeProcess: 'Vykonať teraz spojenie',
				mergeThisEntity: 'Spojiť položku',
				mergeWithInput: 'Spojiť s:',
				mergeWithProgress: 'Spojiť s...',
				mergeWizard: 'Nástroj na spájanie',
				pleaseWait: 'Prosím čakajte...',
				postpone: 'Odložiť',
				postponeTitle: 'Uložiť id položky a odložiť spojenie',
				unwatchOption: 'Odstrániť spájané položky zo sledovaných stránok (ak sú sledované)',
				unwatching: 'Odstraňujem zo sledovaných stránok...'
			},
			sv: {
				conflictMessage: 'En konflikt upptäcktes på ',
				conflictWithMessage: 'med',
				createRedirect: 'Skapa en omdirigering',
				creatingRedirect: 'Skapar omdirigeringen...',
				errorWhile: 'Fel vid "$1":',
				invalidInput: 'För närvarande är en giltig inmatning endast Qid/Lid',
				loadMergeDestination: 'Gå till sammanfogningsmålet efter processen',
				loadingMergeDestination: 'Laddar sammanfogningsmål...',
				lowestEntityId: 'Sammanfoga alltid med äldre entitet (bocka ur för att sammanfoga med "Sammanfoga med"-entiteten)',
				merge: 'Sammanfoga',
				mergePendingNotification: 'Merge.js startades.<br>Du kan nu rikta din webbläsare till den andra entiteten.',
				mergeProcess: 'Behandla sammanfogningen nu',
				mergeSummary: 'Lägg till följande text i den automatiskt genererade redigeringssammanfattningen:',
				mergeThisEntity: 'Sammanfoga den här entiteten',
				mergeWithInput: 'Sammanfoga med:',
				mergeWithProgress: 'Sammanfoga med...',
				mergeWizard: 'Sammanfogningsguide',
				pleaseWait: 'Var god vänta...',
				postpone: 'Senarelägg',
				postponeTitle: 'Lagra den här entitetens ID och senarelägg sammanfogningen',
				reportError: 'Om du anser att det är fel kan du rapportera det [[här]] med källa och sammanfogningens mål.',
				selectForMerging: 'Välj för sammanfogning',
				selectForMergingTitle: 'Kom ihåg denna entitet som den andra av två entiteter som ska sammanfogas',
				unwatchOption: 'Ta bort den sammanfogade entiteten från din bevakningslista (om den bevakas)',
				unwatching: 'Tar bort från bevakningslista...'
			},
			tr: {
				conflictMessage: 'Bir çakışma tespit edildi: ',
				conflictWithMessage: 'ile',
				createRedirect: 'Yönlendirme oluştur',
				creatingRedirect: 'Yönlendirme oluşturuluyor...',
				errorWhile: '"$1" sırasında hata oluştu:',
				invalidInput: 'Şu anda yalnızca Qid/Lid geçerli bir giriştir',
				loadMergeDestination: 'Birleştirme işlemi başarılı olursa hedef sayfayı aç',
				loadingMergeDestination: 'Birleştirme hedefi yükleniyor...',
				lowestEntityId: 'Her zaman oluşturma tarihi eski olan öğeye birleştir (bu seçeneği kaldırarak "Birleştirilecek" hedef öğeye birleştir)',
				merge: 'Birleştir',
				mergePendingNotification: 'Merge.js başlatıldı.<br>Şimdi tarayıcınızı diğer öğeye odaklayabilirsiniz.',
				mergeProcess: 'Birleştirmeyi şimdi işle',
				mergeSummary: 'Otomatik olarak oluşturulan değişiklik özetine şu metni ekleyin:',
				mergeThisEntity: 'Bu öğeyi birleştir',
				mergeWithInput: 'Şununla birleştir:',
				mergeWithProgress: 'Şununla birleştir...',
				mergeWizard: 'Birleştirme Sihirbazı',
				pleaseWait: 'Lütfen bekleyin...',
				postpone: 'Ertele',
				postponeTitle: 'Bu öğenin kimliğini sakla ve birleştirmeyi ertele',
				reportError: 'Bir hata olduğunu düşünüyorsanız, lütfen bunu [[burada]] kaynağı ve hedefi ile bildirin.',
				selectForMerging: 'Birleştirme için seç',
				selectForMergingTitle: 'Bu öğeyi birleştirilecek iki öğeden ikinci olarak hatırlayın',
				unwatchOption: 'Birleştirilen öğeyi izleme listenizden çıkar (izleniyorsa)',
				unwatching: 'İzleme listesinden çıkarılıyor...',
			},
			uk: {
				conflictMessage: 'Виявлено конфлікт у ',
				conflictWithMessage: 'з',
				createRedirect: 'Створити перенаправлення',
				creatingRedirect: 'Створення перенаправлення...',
				errorWhile: 'Помилка при «$1»:',
				invalidInput: 'Наразі лише ідентифікатор (Qid) може бути валідними вхідними даними',
				loadingMergeDestination: 'Завантаження цільової сторінки до об\'єднання...',
				lowestEntityId: 'Завжди приєднувати до старішого елемента (зніміть позначку, щоб приєднати до елемента, вказаного в «Об\'єднати з»)',
				merge: 'Об\'єднати',
				mergePendingNotification: 'Merge.js було запущено.<br>Тепер Ви можете перемкнути свій браузер на інший елемент.',
				mergeProcess: 'Виконати об\'єднання зараз же',
				mergeSummary: 'Додати цей текст до автоматичного опису редагування:',
				mergeThisEntity: 'Приєднати цей елемент',
				mergeWithInput: 'Об\'єднати з:',
				mergeWithProgress: 'Об\'єднати з...',
				mergeWizard: 'Майстер об\'єднання',
				pleaseWait: 'Зачекайте, будь ласка...',
				postpone: 'Відкласти',
				postponeTitle: 'Збережіть ідентифікатор цього елемента та відкладіть об\'єднання на пізніше',
				//reportError: 'Будь ласка, повідомте про помилку [[отут]], вказавши вихідний та цільовий елементи до об\'єднання.',
				selectForMerging: 'Вибрати для об\'єднання',
				selectForMergingTitle: 'Запам\'ятати цей елемент як другий з тих, котрі треба об\'єднати',
				unwatchOption: 'Вилучити приєднаний елемент з Вашого списку спостереження (якщо він був у ньому)',
				unwatching: 'Вилучення зі списку спостереження...'
			},
			vi: {
				conflictMessage: 'Đã phát hiện mâu thuẫn nội dung tại ',
				conflictWithMessage: 'với',
				createRedirect: 'Tạo đổi hướng',
				creatingRedirect: 'Đang tạo đổi hướng...',
				errorWhile: 'Lỗi khi "$1":',
				invalidInput: 'Hiện chỉ có ID khoản mục/từ vi là đầu vào hợp lệ',
				loadMergeDestination: 'Tải khoản mục đích đã hợp nhất khi thành công',
				loadingMergeDestination: 'Đang tải trang đích đã được hợp nhất...',
				lowestEntityId: 'Luôn hợp nhất vào thực thể cũ hơn (bỏ chọn để hợp nhất vào thực thể "Hợp nhất với")',
				merge: 'Hợp nhất',
				mergePendingNotification: 'Merge.js đã bắt đầu.<br>Bạn có thể truy cập tab khác trên trình duyệt, nhưng không được đóng tab này',
				mergeProcess: 'Đang hợp nhất',
				mergeSummary: 'Thêm văn bản sau vào bản tóm lược sửa đổi được tạo tự động:',
				mergeThisEntity: 'Hợp nhất thực thể này',
				mergeWithInput: 'Hợp nhất với:',
				mergeWithProgress: 'Hợp nhất với...',
				mergeWizard: 'Thuật sĩ hợp nhất',
				pleaseWait: 'Vui lòng chờ...',
				postpone: 'Hoãn',
				postponeTitle: 'Lưu trữ ID của thực thể này và hoãn hợp nhất',
				reportError: 'Nếu bạn tin rằng đây là lỗi, hãy báo cáo tại [[đây]] với khoản mục nguồn và khoản mục đích.',
				selectForMerging: 'Chọn',
				selectForMergingTitle: 'Hãy nhớ thực thể này là thực thể thứ hai trong hai thực thể được hợp nhất',
				unwatchOption: 'Xóa thực thể đã hợp nhất khỏi danh sách theo dõi của bạn (nếu đã thêm)',
				unwatching: 'Đang xóa khỏi danh sách theo dõi...'
			},
			'zh-hans': {
				conflictMessage: '存在跨语言冲突：',
				conflictWithMessage: '和',
				createRedirect: '创建重定向',
				creatingRedirect: '创建重定向中…',
				errorWhile: '"$1"时出错：',
				invalidInput: '目前只有一个Qid是有效的',
				loadMergeDestination: '成功加载目标项',
				loadingMergeDestination: '正在加载目标项……',
				lowestEntityId: 'Always merge into the older entity (uncheck to merge into the "要和此项合并的数据项" entity)',
				merge: '合并',
				mergePendingNotification: 'Merge.js已经运行，请前往其他需要合并的项。',
				mergeProcess: '开始合并',
				mergeSummary: '将以下文本添加到自动生成的编辑摘要中：',
				mergeThisEntity: '合并此项',
				mergeWithInput: '要和此项合并的数据项：',
				mergeWithProgress: '合并',
				mergeWizard: '合并数据项',
				pleaseWait: '请稍候……',
				postpone: '和其他项合并',
				postponeTitle: '储存此项编号以和其他项合并',
				//reportError: '请将上述错误报告到[[这里]]，包括合并的来源及目的地',
				selectForMerging: '选择合并项',
				selectForMergingTitle: '记住这个项目是要合并的两个项目中的第二个项目。',
				unwatchOption: '若可能，从监视列表移除重复项',
				unwatching: '正在从监视列表移除重复项……',
			},
			'zh-hant': {
				conflictMessage: '存在跨語言衝突：',
				conflictWithMessage: '和',
				createRedirect: '創建重定向',
				creatingRedirect: '創建重定向中…',
				errorWhile: '"$1"時出錯：',
				invalidInput: '目前只有一個Qid是有效的',
				loadMergeDestination: '成功加載目標項',
				loadingMergeDestination: '正在加載目標項……',
				lowestEntityId: 'Always merge into the older entity (uncheck to merge into the "要和此項合併的數據項" entity)',
				merge: '合併',
				mergePendingNotification: 'Merge.js已經運行，請前往其他需要合併的項。',
				mergeProcess: '開始合併',
				mergeSummary: '將以下文本添加到自動生成的編輯摘要中：',
				mergeThisEntity: '合併此項',
				mergeWithInput: '要和此項合併的數據項：',
				mergeWithProgress: '合併',
				mergeWizard: '合併數據項',
				pleaseWait: '請稍候……',
				postpone: '和其他項合併',
				postponeTitle: '儲存此項編號以和其他項合併',
				reportError: '請將上述錯誤報告到[[這裡]]，包括合併的來源及目的地',
				selectForMerging: '選擇合併項',
				selectForMergingTitle: '記住這個項目是要合併的兩個項目中的第二個項目。',
				unwatchOption: '若可能，從監視列表移除重複項',
				unwatching: '正在從監視列表移除重複項……',
			},
		},
			chain = mw.language.getFallbackLanguageChain(),
			len = chain.length,
			ret = {},
			i = len - 1;
		while (i >= 0) {
			if (translations.hasOwnProperty(chain[i])) {
				$.extend(ret, translations[chain[i]]);
			}
			i = i - 1;
		}
		return ret;
	}());

	/**
	 * Retrieve items by id
	 */
	function getItems(ids) {
		return api.get({
			action: 'wbgetentities',
			ids: ids.join('|')
		}).then(function (data) {
			return Object.keys(data.entities).map(function (x) { return data.entities[x]; });
		});
	}

	/**
	 * Set a Storage to postpone merge and deletion
	 */
	function mergePending(id) {
		mw.storage.set('merge-pending-id', id);
		mw.notify($.parseHTML(messages.mergePendingNotification));
	}

	/**
	 * ...and reset this Storage
	 */
	function removePending() {
		mw.storage.remove('merge-pending-id');
	}

	/**
	 * Check if items can be merged
	 */
	function detectConflicts(items) {
		var all = {},
			conflicts = {};
		items.forEach(function (item) {
			if (!item.sitelinks) { return; }
			Object.keys(item.sitelinks).forEach(function (dbName) {
				if (all[dbName] && all[dbName].sitelinks[dbName].title !== item.sitelinks[dbName].title) {
					if (!conflicts[dbName]) {
						conflicts[dbName] = [all[dbName]];
					}
					conflicts[dbName].push(item);
				}
				all[dbName] = item;
			});
		});
		return conflicts;
	}

	/**
	 * Create a redirect
	 */
	function createRedirect(fromId, toId) {
		// ugly hack, we have to clear the entity first before creating the redirect...
		return api.postWithEditToken({
			action: 'wbeditentity',
			assertuser: mw.config.get( 'wgUserName' ),
			id: fromId,
			clear: true,
			summary: 'Clearing item to prepare for redirect',
			tags: 'gadget-merge',
			data: '{}'
		}).then(function () {
			// wbcreateredirect doesn't have a "tags" parameter ([[phab:T229918]])
			return api.postWithEditToken({
				action: 'wbcreateredirect',
				assertuser: mw.config.get( 'wgUserName' ),
				from: fromId,
				to: toId
			});
		});
	}

	/**
	 * Moving logic
	 */
	function mergeApi(from, to, mergeSummary) {
		var isLexeme = from[0] === 'L';
		var data;
		if (isLexeme) {
			data = {
				action: 'wblmergelexemes',
				assertuser: mw.config.get( 'wgUserName' ),
				source: from,
				tags: 'gadget-merge',
				target: to,
			};
		} else {
			data = {
				action: 'wbmergeitems',
				assertuser: mw.config.get( 'wgUserName' ),
				fromid: from,
				tags: 'gadget-merge',
				toid: to,
				ignoreconflicts: 'description', // ignore descriptions conflicts as old version of merge did
			};
		}
		data.summary = mergeSummary;
		return api.postWithEditToken(data).then(function (data) {
			if (isLexeme) {
				// For wblmergelexemes, if there's no error, the redirect was created;
				// create a fake "redirected" member which the merger expects from wbmergeitems.
				// (And we know there was no error because otherwise postWithEditToken()
				// would have rejected without running this handler.)
				data.redirected = true;
			}
			return data;
		});
	}

	/**
	 * @class Merger
	 * @mixins OO.EventEmitter
	 *
	 * @constructor
	 */
	function Merger(mergeItems, mergeSummary, alwaysLowestId, unwatch, mergeCreateRedirect, loadMergeDestination) {
		OO.EventEmitter.call(this);
		this.mergeItems = mergeItems;
		this.mergeSummary = mergeSummary;
		if (/^\w/.test(this.mergeSummary)) {
			this.mergeSummary = ' ' + this.mergeSummary;
		}
		this.alwaysLowestId = alwaysLowestId;
		this.unwatch = unwatch;
		this.mergeCreateRedirect = mergeCreateRedirect;
		this.loadMergeDestination = loadMergeDestination;
	}
	OO.mixinClass(Merger, OO.EventEmitter);

	/**
	 * Merge process
	 */
	Merger.prototype.merger = function (from, to) {
		var self = this;
		self.emit('progress', messages.mergeWithInput + ' ' + to);
		var redirected;
		var deferred = mergeApi(from, to, self.mergeSummary)
			.then(function (data) {
				redirected = data.redirected;
				return $.Deferred().resolve();
			});

		if (self.unwatch) {
			deferred = deferred.then(function () {
				self.emit('progress', messages.unwatching);
				return api.unwatch(from);
			});
		}

		if (self.mergeCreateRedirect) {
			deferred = deferred.then(function () {
				if (redirected) { // don't create redirect if already redirected
					return $.Deferred().resolve();
				}
				self.emit('progress', messages.creatingRedirect);
				return createRedirect(from, to);
			});
		}

		deferred.then(function () {
			if (self.loadMergeDestination) {
				self.emit('progress', messages.loadingMergeDestination);
				var target = mw.config.get('wgPageName').replace(from, to);
				// Purge (via API), then reload.
				// XXX: Do we even need to purge? Why?
				api.post({
					action: 'purge',
					titles: target
				}).then(function () {
					window.location = mw.util.getUrl(target);
				});
			} else {
				self.emit('success');
			}
		}, function (code, result) {
			self.emit('error', result.error.extradata && result.error.extradata[0] || result.error.info);
		});
	};

	/**
	 * Merge button action, pre-merge checks
	 */
	Merger.prototype.merge = function () {
		var self = this,
			itemsNames = [$.trim(self.mergeItems).toUpperCase(), entityId],
			isAllQ = itemsNames.every(function (x) { return /^Q\d*$/i.test(x); }),
			isAllL = itemsNames.every(function (x) { return /^L\d*$/i.test(x); });
		if (!(isAllQ || isAllL)) {
			$('#merge-input-validation-message').text(messages.invalidInput);
			return;
		}
		self.emit('progress', messages.pleaseWait);
		getItems(itemsNames).then(function (items) {
			// duplicate item if just an item is returned
			// if item was being merged to itself this could conflict error that also useful for debugging conflict detector
			if (items.length === 1) {
				items = items.concat(items);
			}

			var conflicts = detectConflicts(items),
				message;
			if (Object.keys(conflicts).length === 0) {
				if (self.alwaysLowestId) {
					items.sort(function (x, y) { return +x.id.replace(/^[QL]/i, '') - y.id.replace(/^[QL]/i, ''); }); // sort by Qid _only_if_specified_
				}
				self.merger(items[1].id, items[0].id);
			} else {
				message = Object.keys(conflicts).map(function (i) {
					var x = conflicts[i];
					return '<br>' + messages.conflictMessage + i + ':' + x.map(function (y, j) {
						return ' [[' + x[j].id + ']] ' + messages.conflictWithMessage +
							' [[' + i + ':' + y.sitelinks[i].title + ']]';
					}).join(',');
				}).join('').replace(/\[\[([^\]\:]*?)\:([^\]]*?)\]\]/g, function (x, y, z) {
					return mw.html.element( 'a', { href: wikibase.sites.getSite(y).getUrlTo(z) }, y + ':' + z );
				});
				self.emit('error', message, true);
			}
		});
	};

	/**
	 * @class MergeDialog
	 * @extends OO.ui.ProcessDialog
	 *
	 * @constructor
	 * @param {Object} config Configuration options
	 * @cfg {string} entityId Entity ID
	 */
	function MergeDialog(config) {
		MergeDialog.parent.call(this, config);
		this.entityId = config.entityId;
	}
	OO.inheritClass(MergeDialog, OO.ui.ProcessDialog);

	MergeDialog.static.name = 'mergeDialog';
	MergeDialog.static.title = messages.mergeWizard;
	MergeDialog.static.size = 'medium';
	MergeDialog.static.actions = [
		{
			action: 'postpone',
			label: messages.postpone,
			title: messages.postponeTitle,
			flags: 'progressive'
		},
		{
			action: 'merge',
			label: messages.merge,
			title: messages.mergeProcess,
			flags: ['primary', 'progressive']
		},
		{
			action: 'cancel',
			label: mw.msg('ooui-dialog-message-reject'),
			flags: ['safe', 'close']
		},
        {
			action: 'controll',
			label: "Zkontrolovat",
			flags: ['primary', 'progressive']
		}
	];

	/**
	 * @inheritdoc
	 */
	MergeDialog.prototype.initialize = function () {
		MergeDialog.parent.prototype.initialize.apply(this, arguments);
		var fieldset = new OO.ui.FieldsetLayout({});
		this.entitySelector = new OO.ui.TextInputWidget({
			value: this.entityId
		});
		this.entitySelector.inputFilter = function (value) {
			if (mw.config.get('wgNamespaceNumber') === 0) {
				return value.replace(/.*(Q[1-9][0-9]*).*/, '$1');
			} else if (mw.config.get('wgNamespaceNumber') === 146) {
				return value.replace(/.*(L[1-9][0-9]*).*/, '$1');
			}
			return value;
		};
		fieldset.addItems([
			new OO.ui.FieldLayout(
				this.entitySelector,
				{
					align: 'left',
					label: messages.mergeWithInput
				}
			)
		]);
		fieldset.$element.append($('<span>', {
			id: 'merge-input-validation-message',
			style: 'color: red;'
		}));
		this.mergeSummary = new OO.ui.TextInputWidget({});
		fieldset.addItems([
			new OO.ui.FieldLayout(
				this.mergeSummary,
				{
					align: 'left',
					label: messages.mergeSummary
				}
			)
		]);
		this.mergeAlwaysLowestId = new OO.ui.CheckboxInputWidget({
			selected: true
		});
		fieldset.addItems([
			new OO.ui.FieldLayout(
				this.mergeAlwaysLowestId,
				{
					align: 'inline',
					label: messages.lowestEntityId
				}
			)
		]);
		this.mergeCreateRedirect = new OO.ui.CheckboxInputWidget({
			selected: true,
			disabled: true
		});
		fieldset.addItems([
			new OO.ui.FieldLayout(
				this.mergeCreateRedirect,
				{
					align: 'inline',
					label: messages.createRedirect
				}
			)
		]);
		this.mergeUnwatch = new OO.ui.CheckboxInputWidget({
			selected: mw.storage.get('merge-unwatch') === 'true'
		});
		fieldset.addItems([
			new OO.ui.FieldLayout(
				this.mergeUnwatch,
				{
					align: 'inline',
					label: messages.unwatchOption
				}
			)
		]);
		this.loadMergeDestination = new OO.ui.CheckboxInputWidget({
			selected: mw.storage.get('merge-load-destination') !== 'false'
		});
		fieldset.addItems([
			new OO.ui.FieldLayout(
				this.loadMergeDestination,
				{
					align: 'inline',
					label: messages.loadMergeDestination
				}
			)
		]);
		var content = new OO.ui.PanelLayout({
			padded: true,
			expanded: false
		});
		content.$element.append(fieldset.$element);
		this.$body.append(content.$element);
		var self = this;
		this.actions.once('add', function () {
			self.actions.setAbilities({ postpone: self.entityId === '' });
		});
		this.$element.prop('lang', $('html').prop('lang'));
	};

	/**
	 * @inheritdoc
	 */
	MergeDialog.prototype.getReadyProcess = function (data) {
		return MergeDialog.parent.prototype.getReadyProcess.call(this, data)
			.next(function () {
				// focus "Merge with" field:
				// https://www.wikidata.org/wiki/?oldid=333747825#Request:_Improvements_for_keyboard_navigation
				this.entitySelector.focus();
			}, this);
	};

	/**
	 * Save options in storage
	 */
	MergeDialog.prototype.saveOptions = function () {
		mw.storage.set('merge-always-lowest-id', this.mergeAlwaysLowestId.isSelected().toString());
		mw.storage.set('merge-unwatch', this.mergeUnwatch.isSelected().toString());
		mw.storage.set('merge-create-redirect', this.mergeCreateRedirect.isSelected().toString());
		mw.storage.set('merge-load-destination', this.loadMergeDestination.isSelected().toString());
	};

	MergeDialog.prototype.merge = function () {
		var self = this;
		this.saveOptions();
		removePending();
		var merger = new Merger(
			this.entitySelector.getValue(),
			this.mergeSummary.getValue(),
			this.mergeAlwaysLowestId.isSelected(),
			this.mergeUnwatch.isSelected(),
			this.mergeCreateRedirect.isSelected(),
			this.loadMergeDestination.isSelected()
		);       
		merger.on('progress', function () {
			self.displayProgress.apply(self, arguments);
		});
		merger.on('error', function () {
			self.displayError.apply(self, arguments);
		});
		merger.on('success', function () {
			self.close();
			$('#ca-merge-queue-process, #ca-merge, #ca-merge-select').remove();
		});
		merger.merge();
	};

    MergeDialog.prototype.controll = function () {
        var self = this;
        this.saveOptions();
        removePending();
        var merger = new Merger(
            this.entitySelector.getValue(),
            this.mergeSummary.getValue(),
            this.mergeAlwaysLowestId.isSelected(),
            this.mergeUnwatch.isSelected(),
            this.mergeCreateRedirect.isSelected(),
            this.loadMergeDestination.isSelected()
        );
        var from = this.entitySelector.getValue();
        var to = entityId;

        getItems([from, to]).then(function (items) {
            var table = '<table class="wikitable"><thead><tr><th>Property</th><th>' + from + '</th><th>' + to + '</th></tr></thead><tbody>';
            var properties = new Set([...Object.keys(items[0].claims), ...Object.keys(items[1].claims)]);
            properties.forEach(function (property) {
                table += '<tr><td>' + property + '</td><td>' + (items[0].claims[property] ? items[0].claims[property].map(showClaim).join(', ') : '') + '</td><td>' + (items[1].claims[property] ? items[1].claims[property].map(showClaim).join(', ') : '') + '</td></tr>';
            });
            table += '</tbody></table>';
            self.close();
            OO.ui.confirm($(table), {
                title: messages.mergeWizard,
                size: 'large',
                width: '80%'
            }).done(function (confirmed) {
                if (confirmed) {
                    merger.on('progress', self.displayProgress.bind(self));
                    merger.on('error', self.displayError.bind(self));
                    merger.on('success', function () {
                        self.close();
                        $('#ca-merge-queue-process, #ca-merge, #ca-merge-select').remove();
                    });
                    merger.merge();
                } else {
                    self.emit('error', 'Merge cancelled by user.');
                }
            });
        });
    };

	MergeDialog.prototype.postpone = function () {
		this.saveOptions();
		mergePending(entityId);
		this.close();
	};

	/**
	 * @inheritdoc
	 */
	MergeDialog.prototype.getActionProcess = function (action) {
		if (action === 'merge') {
			return new OO.ui.Process(this.merge, this);
		}
        if (action === 'controll') {
			return new OO.ui.Process(this.controll, this);
		}
		if (action === 'postpone') {
			return new OO.ui.Process(this.postpone, this);
		}
		if (action === 'cancel') {
			return new OO.ui.Process(this.close, this);
		}
		return MergeDialog.parent.prototype.getActionProcess.call(this, action);
	};

	/**
	 * Display progress on form dialog
	 */
	MergeDialog.prototype.displayProgress = function (message) {
		if (this.$progressMessage) {
			this.$progressMessage.text(message);
			this.updateSize();
			return;
		}
		this.$body.children().hide();
		this.actions.forEach(null, function (action) {
			action.setDisabled(true); // disable buttons
		});
		this.$progressMessage = $('<span>').text(message);
		this.pushPending();
		$('<div>').css({
			'text-align': 'center',
			'margin': '3em 0',
			'font-size': '120%'
		}).append(
			this.$progressMessage
		).appendTo(this.$body);
		this.updateSize();
	};

	/**
	 * Display error on form dialog
	 */
	MergeDialog.prototype.displayError = function (error, hideReportLink) {
		var reportLink;
		this.$body.children().hide();
		while (this.isPending()) {
			this.popPending();
		}
		this.actions.forEach(null, function (action) {
			// reenable 'cancel' button, disable all other buttons
			// https://www.wikidata.org/wiki/?oldid=323115101#Close.2FCancel
			action.setDisabled(action.getAction() !== 'cancel');
		});
		if (hideReportLink === true) {
			reportLink = '';
		} else {
			reportLink = '<p>' + messages.reportError.replace(/\[\[(.*)\]\]/, '<a href="//www.wikidata.org/w/index.php?title=MediaWiki_talk:Gadget-Merge.js&action=edit&section=new" target="_blank">$1</a>') + '</p>';
		}
		this.$body.append($('<div>', {
			style: 'color: #990000; margin-top: 0.4em;',
			html: '<p>' + messages.errorWhile.replace(/\$1/, this.$progressMessage.text()) + ' ' + error + '</p>' + reportLink
		}));
		this.updateSize();
	};

	/**
	 * Dialog creator and launcher
	 */
	function launchDialog(id) {
		if (typeof id !== 'string') {
			id = '';
		}
		var dialog = new MergeDialog({
			entityId: id
		});
		var windowManager = new OO.ui.WindowManager();
		$('body').append(windowManager.$element);
		windowManager.addWindows([dialog]);
		windowManager.openWindow(dialog);
	}

	// Initialization
	if (entityId !== null &&
		[0, 146].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 &&
		mw.config.get('wgAction') === 'view') {
		$(window).on('focus storage', function () {
			$('#ca-merge-queue-process').remove();
			if (mw.storage.get('merge-pending-id') !== null &&
				mw.storage.get('merge-pending-id') !== '' &&
				mw.storage.get('merge-pending-id') !== entityId) {
				$('#p-views ul')[$(document).prop('dir') === 'rtl' ? 'append' : 'prepend']($('<li>', {
					id: 'ca-merge-queue-process'
				}).append($('<a>', {
					href: '#',
					title: 'process the postponed merge'
				}).append($('<img>', {
					src: '//upload.wikimedia.org/wikipedia/commons/1/10/Pictogram_voting_merge.svg',
					alt: 'merge icon',
					width: '20px',
					height: '20px'
				}))).click(function (event) {
					event.preventDefault();
					launchDialog(mw.storage.get('merge-pending-id'));
				}));
			}
		});
		$(function () {
			$('#ca-merge-queue-process, #ca-merge, #ca-merge-select').remove();
			$(mw.util.addPortletLink(
				'p-cactions',
				'#',
				messages.mergeWithProgress,
				'ca-merge',
				messages.mergeThisEntity,
				'm'
			)).click(function (event) {
				event.preventDefault();
				launchDialog();
			});

			$(mw.util.addPortletLink(
				'p-cactions',
				'#',
				messages.selectForMerging,
				'ca-merge-select',
				messages.selectForMergingTitle
			)).click(function (event) {
				event.preventDefault();
				mergePending(entityId);
			});
		});
	}

	// Export section
	// currently just for [[MediaWiki:Gadget-EmptyDetect.js]], just launchDialog is exposed
	window.mergeTool = {
		launchDialog: launchDialog
	};
}

// Although this dependency is enabled in the gadgets definition users are loading
// the script via mw.loader.getScript('https://www.wikidata.org/w/index.php?title=MediaWiki:Gadget-Merge.js&action=raw&ctype=text/javascript');
// This dependency loading can be dropped when the query https://global-search.toolforge.org/?q=MediaWiki%3AGadget-Merge.js&regex=1&namespaces=&title=.*.js
// returns 0 results.
mw.loader.using(['oojs-ui']).then( function () {
	init(jQuery, mediaWiki, OO);
});

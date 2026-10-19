import { normalizeLocale, type AppLocale } from "./locales";

/**
 * Testi delle email transazionali e del piè di pagina delle campagne, per lingua.
 * Modulo puro: usato sia da Convex (invio campagne) sia da Next.js (conferma, benvenuto, risposta contatti).
 */
export type EmailStrings = {
  confirm: { subject: string; heading: string; intro: string; button: string; hint: string; ignore: string };
  welcome: { subject: string; heading: string; body: string; footerLead: string; unsubscribe: string };
  contactReply: { subject: string; greeting: (name: string) => string; body: string; signature: string };
  campaign: { received: string; unsubscribe: string };
};

const S: Record<AppLocale, EmailStrings> = {
  en: {
    confirm: {
      subject: "Confirm your subscription to the Winex newsletter",
      heading: "Confirm your subscription",
      intro: "You asked to receive the Winex newsletter. Press the button below to confirm your email address.",
      button: "Confirm subscription",
      hint: "The link is valid for 7 days. If the button does not work, copy this address into your browser:",
      ignore: "If you did not request this subscription, ignore this message: you will receive nothing and your address will be deleted automatically.",
    },
    welcome: {
      subject: "Welcome to Winex",
      heading: "Welcome",
      body: "Your subscription is confirmed. We will send you news about products, projects and offers from Winex.",
      footerLead: "You can unsubscribe at any time:",
      unsubscribe: "Unsubscribe",
    },
    contactReply: {
      subject: "We have received your message — Winex",
      greeting: (n) => `Hello ${n},`,
      body: "We have received your message and will get back to you as soon as possible.",
      signature: "— The Winex team",
    },
    campaign: { received: "You are receiving this email because you subscribed to the Winex newsletter.", unsubscribe: "Unsubscribe" },
  },
  ro: {
    confirm: {
      subject: "Confirmă abonarea la newsletterul Winex",
      heading: "Confirmă abonarea",
      intro: "Ai cerut să primești newsletterul Winex. Apasă butonul de mai jos pentru a confirma adresa de e-mail.",
      button: "Confirmă abonarea",
      hint: "Linkul este valabil 7 zile. Dacă butonul nu funcționează, copiază această adresă în browser:",
      ignore: "Dacă nu ai cerut tu această abonare, ignoră acest mesaj: nu vei primi nimic, iar adresa ta va fi ștearsă automat.",
    },
    welcome: {
      subject: "Bine ai venit la Winex",
      heading: "Bine ai venit",
      body: "Abonarea ta este confirmată. Îți vom trimite noutăți despre produse, proiecte și oferte Winex.",
      footerLead: "Te poți dezabona oricând:",
      unsubscribe: "Dezabonează-te",
    },
    contactReply: {
      subject: "Am primit mesajul tău — Winex",
      greeting: (n) => `Bună, ${n},`,
      body: "Am primit mesajul tău și revenim cât mai curând.",
      signature: "— Echipa Winex",
    },
    campaign: { received: "Primești acest e-mail pentru că te-ai abonat la newsletterul Winex.", unsubscribe: "Dezabonează-te" },
  },
  it: {
    confirm: {
      subject: "Conferma l’iscrizione alla newsletter di Winex",
      heading: "Conferma la tua iscrizione",
      intro: "Hai richiesto di ricevere la newsletter di Winex. Premi il pulsante qui sotto per confermare il tuo indirizzo email.",
      button: "Conferma iscrizione",
      hint: "Il link è valido per 7 giorni. Se il pulsante non funziona, copia questo indirizzo nel browser:",
      ignore: "Se non hai richiesto tu questa iscrizione, ignora questo messaggio: non riceverai nulla e il tuo indirizzo verrà eliminato automaticamente.",
    },
    welcome: {
      subject: "Benvenuto in Winex",
      heading: "Benvenuto",
      body: "La tua iscrizione è confermata. Ti invieremo novità su prodotti, progetti e offerte di Winex.",
      footerLead: "Puoi annullare l’iscrizione in qualsiasi momento:",
      unsubscribe: "Annulla l’iscrizione",
    },
    contactReply: {
      subject: "Abbiamo ricevuto il tuo messaggio — Winex",
      greeting: (n) => `Buongiorno ${n},`,
      body: "Abbiamo ricevuto il tuo messaggio e ti risponderemo il prima possibile.",
      signature: "— Il team Winex",
    },
    campaign: { received: "Ricevi questa email perché ti sei iscritto alla newsletter di Winex.", unsubscribe: "Annulla l’iscrizione" },
  },
  fr: {
    confirm: {
      subject: "Confirmez votre inscription à la newsletter Winex",
      heading: "Confirmez votre inscription",
      intro: "Vous avez demandé à recevoir la newsletter Winex. Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail.",
      button: "Confirmer l’inscription",
      hint: "Le lien est valable 7 jours. Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :",
      ignore: "Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : vous ne recevrez rien et votre adresse sera supprimée automatiquement.",
    },
    welcome: {
      subject: "Bienvenue chez Winex",
      heading: "Bienvenue",
      body: "Votre inscription est confirmée. Nous vous enverrons des nouvelles sur les produits, les projets et les offres de Winex.",
      footerLead: "Vous pouvez vous désinscrire à tout moment :",
      unsubscribe: "Se désinscrire",
    },
    contactReply: {
      subject: "Nous avons bien reçu votre message — Winex",
      greeting: (n) => `Bonjour ${n},`,
      body: "Nous avons bien reçu votre message et reviendrons vers vous dans les meilleurs délais.",
      signature: "— L’équipe Winex",
    },
    campaign: { received: "Vous recevez cet e-mail parce que vous êtes inscrit à la newsletter Winex.", unsubscribe: "Se désinscrire" },
  },
  pl: {
    confirm: {
      subject: "Potwierdź zapis do newslettera Winex",
      heading: "Potwierdź zapis",
      intro: "Zgłoszono prośbę o wysyłanie newslettera Winex na ten adres e-mail. Kliknij przycisk poniżej, aby potwierdzić adres.",
      button: "Potwierdź zapis",
      hint: "Link jest ważny przez 7 dni. Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:",
      ignore: "Jeśli ta prośba nie pochodzi od Ciebie, zignoruj tę wiadomość: nie otrzymasz żadnych wiadomości, a adres zostanie automatycznie usunięty.",
    },
    welcome: {
      subject: "Witamy w Winex",
      heading: "Witamy",
      body: "Twój zapis został potwierdzony. Będziemy przesyłać informacje o produktach, projektach i ofertach Winex.",
      footerLead: "Możesz zrezygnować w dowolnym momencie:",
      unsubscribe: "Zrezygnuj z subskrypcji",
    },
    contactReply: {
      subject: "Otrzymaliśmy Twoją wiadomość — Winex",
      greeting: (n) => `Dzień dobry ${n},`,
      body: "Otrzymaliśmy Twoją wiadomość i odpowiemy najszybciej, jak to możliwe.",
      signature: "— Zespół Winex",
    },
    campaign: { received: "Otrzymujesz tę wiadomość, ponieważ ten adres e-mail został zapisany do newslettera Winex.", unsubscribe: "Zrezygnuj z subskrypcji" },
  },
  nl: {
    confirm: {
      subject: "Bevestig uw inschrijving voor de Winex-nieuwsbrief",
      heading: "Bevestig uw inschrijving",
      intro: "U hebt gevraagd de Winex-nieuwsbrief te ontvangen. Klik op de knop hieronder om uw e-mailadres te bevestigen.",
      button: "Inschrijving bevestigen",
      hint: "De link is 7 dagen geldig. Werkt de knop niet? Kopieer dan dit adres in uw browser:",
      ignore: "Hebt u deze inschrijving niet aangevraagd? Negeer dan dit bericht: u ontvangt niets en uw adres wordt automatisch verwijderd.",
    },
    welcome: {
      subject: "Welkom bij Winex",
      heading: "Welkom",
      body: "Uw inschrijving is bevestigd. Wij sturen u nieuws over producten, projecten en aanbiedingen van Winex.",
      footerLead: "U kunt zich op elk moment uitschrijven:",
      unsubscribe: "Uitschrijven",
    },
    contactReply: {
      subject: "Wij hebben uw bericht ontvangen — Winex",
      greeting: (n) => `Goedendag ${n},`,
      body: "Wij hebben uw bericht ontvangen en nemen zo snel mogelijk contact met u op.",
      signature: "— Het Winex-team",
    },
    campaign: { received: "U ontvangt deze e-mail omdat u bent ingeschreven voor de Winex-nieuwsbrief.", unsubscribe: "Uitschrijven" },
  },
  de: {
    confirm: {
      subject: "Bestätigen Sie Ihre Anmeldung zum Winex-Newsletter",
      heading: "Anmeldung bestätigen",
      intro: "Sie haben angefordert, den Winex-Newsletter zu erhalten. Klicken Sie auf die Schaltfläche unten, um Ihre E-Mail-Adresse zu bestätigen.",
      button: "Anmeldung bestätigen",
      hint: "Der Link ist 7 Tage gültig. Funktioniert die Schaltfläche nicht, kopieren Sie diese Adresse in Ihren Browser:",
      ignore: "Wenn Sie diese Anmeldung nicht veranlasst haben, ignorieren Sie diese Nachricht: Sie erhalten nichts und Ihre Adresse wird automatisch gelöscht.",
    },
    welcome: {
      subject: "Willkommen bei Winex",
      heading: "Willkommen",
      body: "Ihre Anmeldung ist bestätigt. Wir senden Ihnen Neuigkeiten zu Produkten, Projekten und Angeboten von Winex.",
      footerLead: "Sie können sich jederzeit abmelden:",
      unsubscribe: "Abmelden",
    },
    contactReply: {
      subject: "Wir haben Ihre Nachricht erhalten — Winex",
      greeting: (n) => `Guten Tag ${n},`,
      body: "Wir haben Ihre Nachricht erhalten und melden uns so bald wie möglich bei Ihnen.",
      signature: "— Das Winex-Team",
    },
    campaign: { received: "Sie erhalten diese E-Mail, weil Sie den Winex-Newsletter abonniert haben.", unsubscribe: "Abmelden" },
  },
};

export function emailStrings(locale: string | undefined | null): EmailStrings {
  return S[normalizeLocale(locale)];
}

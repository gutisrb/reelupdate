// Email Templates in Serbian

export const emailTemplates = {
  welcome: (userName: string, credits: number) => ({
    subject: 'Dobrodošli u ReelUpdate! 🎥',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .credits { background: #f0f4ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎥 Dobrodošli u ReelUpdate!</h1>
          </div>
          <div class="content">
            <p>Zdravo ${userName || 'korisnče'}!</p>
            
            <p>Dobrodošli u ReelUpdate - AI platformu za kreiranje viralnih video tura za nekretnine!</p>
            
            <div class="credits">
              <h2 style="margin: 0; color: #667eea;">✨ ${credits} Besplatnih Video Kredita</h2>
              <p style="margin: 10px 0 0 0; color: #666;">Počnite odmah!</p>
            </div>
            
            <p><strong>Šta možete uraditi:</strong></p>
            <ul>
              <li>Kreirajte profesionalne video ture od fotografija</li>
              <li>AI glasovna naracrja na srpskom jeziku</li>
              <li>Automatski titlovi i muzika</li>
              <li>Direktno objavljivanje na TikTok, Instagram i Facebook</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://reelupdate.com/app" class="button">Kreiraj Prvi Video →</a>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Imate pitanja? Odgovorite na ovaj email ili nas kontaktirajte na <a href="mailto:podrska@reelupdate.com">podrska@reelupdate.com</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 ReelUpdate. Sva prava zadržana.</p>
            <p><a href="https://reelupdate.com/terms" style="color: #667eea;">Uslovi korišćenja</a> • <a href="https://reelupdate.com/privacy" style="color: #667eea;">Politika privatnosti</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  lowCredits: (userName: string, creditsRemaining: number) => ({
    subject: 'Preostali krediti: samo još ' + creditsRemaining,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Krediti se završavaju</h1>
          </div>
          <div class="content">
            <p>Zdravo ${userName || 'korisniče'}!</p>
            
            <div class="warning">
              <strong>Preostalo vam je samo ${creditsRemaining} ${creditsRemaining === 1 ? 'video kredit' : 'video kredita'}.</strong>
            </div>
            
            <p>Da nastavite sa kreiranjem viralnih video tura, preporučujemo nadogradnju na Professional plan:</p>
            
            <ul>
              <li>✅ 20 videa mesečno</li>
              <li>✅ Automatsko objavljivanje na sve platforme</li>
              <li>✅ Visual hooks za viralnost</li>
              <li>✅ Prioritetna obrada</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://reelupdate.com/pricing" class="button">Pogledaj Planove →</a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Ili nastavite sa trenutnim planom - krediti se obnavljaju svakog meseca.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  videoComplete: (userName: string, videoUrl: string) => ({
    subject: '✅Video je spreman!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; }
          .button { display: inline-block; padding: 12px 30px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Vaš video je spreman!</h1>
          </div>
          <div class="content">
            <p>Zdravo ${userName || 'korisniče'}!</p>
            
            <p>Odlične vesti - vaš AI-generisani video je uspešno kreiran i spreman za preuzimanje!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${videoUrl}" class="button">Preuzmi Video →</a>
            </div>
            
            <p><strong>Sledeći koraci:</strong></p>
            <ul>
              <li>Preuzmite video i pregledajte ga</li>
              <li>Objavite direktno na TikTok, Instagram ili Facebook</li>
              <li>Ili postavite ga ručno kada budete spremni</li>
            </ul>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Vaš video je dostupan u Galeriji tokom narednih 30 dana.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  paymentSuccess: (userName: string, planName: string, amount: string) => ({
    subject: 'Plaćanje uspešno! 🎊',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎊 Hvala na pretplati!</h1>
          </div>
          <div class="content">
            <p>Zdravo ${userName || 'korisniče'}!</p>
            
            <div class="success">
              <strong>Vaša pretplat je aktivirana!</strong>
            </div>
            
            <p><strong>Detalji:</strong></p>
            <ul>
              <li>Plan: ${planName}</li>
              <li>Iznos: ${amount}</li>
              <li>Status: Aktivno</li>
            </ul>
            
            <p>Vaši krediti su već dodati na nalog i možete odmah početi sa kreiranjem videa!</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Račun možete preuzeti u bilo kom trenutku iz sekcije Billing u vašim podešavanjima.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  intakeNotification: (data: any) => ({
    subject: `🎯 Nova prijava - ${data.name} (${data.agency})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; }
          .header { background: #f8f9fa; padding: 20px; border-bottom: 2px solid #007bff; }
          .content { padding: 20px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; color: #555; }
          .value { color: #000; }
          .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎯 Nova prijava za pristup</h2>
          </div>
          <div class="content">
            <div class="section-title">Kontakt Informacije</div>
            <div class="field"><span class="label">Ime i prezime:</span> <span class="value">${data.name}</span></div>
            <div class="field"><span class="label">Email:</span> <span class="value">${data.email}</span></div>
            <div class="field"><span class="label">Telefon:</span> <span class="value">${data.phone}</span></div>
            <div class="field"><span class="label">Agencija:</span> <span class="value">${data.agency}</span></div>

            <div class="section-title">Kvalifikacioni Podaci</div>
            <div class="field"><span class="label">Videa mesečno:</span> <span class="value">${data.videosPerMonth || 'Nije navedeno'}</span></div>
            <div class="field"><span class="label">Nekretnina mesečno:</span> <span class="value">${data.propertiesPerMonth || 'Nije navedeno'}</span></div>
            <div class="field"><span class="label">Platforme:</span> <span class="value">${data.platforms ? data.platforms.join(', ') : 'Nije navedeno'}</span></div>
            <div class="field"><span class="label">Trenutni način pravljenja:</span> <span class="value">${data.currentMethod || 'Nije navedeno'}</span></div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              Primljeno: ${new Date().toLocaleString('sr-RS')}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  intakeAutoReply: (userName: string) => ({
    subject: 'Primili smo vašu prijavu za ReelUpdate! 🎥',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">🎥 ReelUpdate</h1>
          </div>
          <div class="content">
            <p>Zdravo ${userName},</p>
            
            <p>Hvala vam na interesovanju za ReelUpdate platformu!</p>
            
            <p>Primili smo vašu prijavu i naš tim će je pregledati u najkraćem roku. S obzirom na veliku zainteresovanost, trudimo se da odgovorimo svima u roku od <strong>24 sata</strong>.</p>
            
            <p><strong>Šta je sledeći korak?</strong></p>
            <p>Ukoliko se vaši odgovori uklapaju u naše trenutne beta kapacitete, kontaktiraćemo vas putem telefona ili emaila kako bismo vam kreirali nalog i objasnili kako da počnete sa kreiranjem vaših prvih AI video tura.</p>
            
            <p>U međuvremenu, možete pogledati primere videa na našem sajtu.</p>
            
            <p style="margin-top: 30px;">
              Srdačan pozdrav,<br>
              <strong>ReelUpdate Tim</strong>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 ReelUpdate • office@smartflow.rs</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
}

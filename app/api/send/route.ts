import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nombre, 
      email, 
      servicio, 
      fecha, 
      hora, 
      localNombre, 
      precio, 
      telefonoLocal,
      direccionLocal, // <--- Nuevo dato
      mapsUrl         // <--- Nuevo dato
    } = body;

    const { data, error } = await resend.emails.send({
      from: 'Agéndalo <onboarding@resend.dev>',
      to: [email],
      // ASUNTO PERSONALIZADO:
      subject: `✅ Reserva Confirmada: ${servicio} en ${localNombre}`,
      html: `
        <div style="font-family: sans-serif; background-color: #f3f4f6; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <div style="background-color: #10B981; padding: 30px; text-align: center;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background: white; width: 80px; height: 80px; border-radius: 50%; text-align: center; vertical-align: middle; padding: 10px;">
    <img src="https://agendalo-talca.vercel.app/logos/logo-agendalo.pngg" width="60" height="60" alt="Agéndalo" style="display: block; margin: 0 auto;" />
</td>
                </tr>
              </table>
              <h1 style="color: white; margin: 15px 0 0; font-size: 24px; font-weight: bold;">¡Reserva Exitosa!</h1>
              <p style="color: #ecfdf5; margin: 5px 0 0; font-size: 16px;">Hola ${nombre}, tu cita está lista.</p>
            </div>

            <div style="padding: 30px;">
              <div style="text-align: center; margin-bottom: 25px;">
                <p style="color: #6B7280; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 5px;">SERVICIO</p>
                <h3 style="color: #111827; font-size: 22px; margin: 0;">${servicio}</h3>
                <p style="color: #059669; font-weight: bold; font-size: 24px; margin: 5px 0 0;">$${precio}</p>
              </div>

              <div style="background-color: #F9FAFB; border-radius: 12px; padding: 20px; border: 1px solid #E5E7EB;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">📅 <strong>Fecha:</strong></td>
                    <td style="padding: 8px 0; color: #111827; text-align: right;">${fecha}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">⏰ <strong>Hora:</strong></td>
                    <td style="padding: 8px 0; color: #111827; text-align: right;">${hora} hrs</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">📍 <strong>Lugar:</strong></td>
                    <td style="padding: 8px 0; color: #111827; text-align: right;">${localNombre}</td>
                  </tr>
                  <tr>
                     <td style="padding: 8px 0; color: #374151;">🏠 <strong>Dirección:</strong></td>
                     <td style="padding: 8px 0; color: #111827; text-align: right; font-size: 14px;">${direccionLocal || 'Dirección por confirmar'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">📞 <strong>Contacto:</strong></td>
                    <td style="padding: 8px 0; color: #111827; text-align: right;">${telefonoLocal || 'N/A'}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${mapsUrl}" target="_blank" style="background-color: #2563EB; color: white; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
                   📍 Ver ubicación en Google Maps
                </a>
              </div>

              <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p style="color: #9CA3AF; font-size: 12px;">Gracias por usar <strong>Agéndalo Talca</strong>.</p>
              </div>
            </div>
            
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
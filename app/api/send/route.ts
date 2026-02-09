import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, servicio, fecha, hora, localNombre, precio, telefonoLocal } = body;

    const { data, error } = await resend.emails.send({
      from: 'Agéndalo <onboarding@resend.dev>', // Correo oficial de pruebas de Resend
      to: [email], // En modo prueba, SOLO llegará si pones el correo con el que te registraste en Resend
      subject: `✅ Reserva Confirmada: ${servicio}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <div style="background-color: #10B981; padding: 30px; text-align: center;">
              <div style="background: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px; line-height: 60px; display:block;">✔</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">¡Reserva Exitosa!</h1>
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
                    <td style="padding: 8px 0; color: #374151;">📞 <strong>Contacto:</strong></td>
                    <td style="padding: 8px 0; color: #111827; text-align: right;">${telefonoLocal || 'N/A'}</td>
                  </tr>
                </table>
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
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
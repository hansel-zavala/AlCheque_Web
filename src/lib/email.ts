import { Resend } from 'resend';

// Inicializar el SDK de Resend usando la clave que estará en el archivo .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

interface AlertEmailParams {
  to: string;
  pacienteExpediente: string;
  montoPendiente: number;
  fechaVencimiento: string;
}

export const enviarAlertaVencimiento = async ({ to, pacienteExpediente, montoPendiente, fechaVencimiento }: AlertEmailParams) => {
  try {
    const data = await resend.emails.send({
      from: 'AlCheque <notificaciones@alcheque.honduras>',
      to: [to],
      subject: `Aviso de Vencimiento de Cuenta - ${pacienteExpediente}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0c4a6e;">Aviso de Vencimiento</h2>
          <p>Estimado padre o tutor,</p>
          <p>Le informamos que la cuenta asociada al expediente <strong>${pacienteExpediente}</strong> presenta un saldo pendiente de <strong>L ${montoPendiente.toFixed(2)}</strong>.</p>
          <p>Esta cuenta vence el <strong>${fechaVencimiento}</strong>. Por favor, realice su pago a la brevedad para evitar recargos o interrupción del servicio terapéutico.</p>
          <br />
          <p>Atentamente,</p>
          <p>Administración del Centro de Educación Especial</p>
        </div>
      `
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar alerta por Resend:', error);
    return { success: false, error };
  }
};

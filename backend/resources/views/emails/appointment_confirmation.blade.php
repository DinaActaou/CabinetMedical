<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #1E3A5F; padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; color: #475569; line-height: 1.6; }
        .card { background-color: #FAFAFA; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .card-row { display: flex; margin-bottom: 10px; }
        .card-label { font-weight: 600; width: 100px; color: #1E3A5F; }
        .status-success { color: #10B981; font-weight: bold; }
        .footer { padding: 20px; text-align: center; color: #94A3B8; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0; font-size: 24px;">MediBook</h1>
        </div>
        <div class="content">
            <p>Bonjour {{ $appointment->patient->name }},</p>
            <p>Votre rendez-vous a été confirmé avec succès.</p>
            
            <div class="card">
                <div class="card-row">
                    <span class="card-label">Médecin :</span>
                    <span>Dr. {{ $appointment->doctor->name }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Service :</span>
                    <span>{{ $appointment->service->name }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Date :</span>
                    <span>{{ $appointment->appointment_date }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Heure :</span>
                    <span>{{ $appointment->appointment_time }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Statut :</span>
                    <span class="status-success">Confirmé ✓</span>
                </div>
            </div>
        </div>
        <div class="footer">
            <p>© 2026 MediBook — Ne pas répondre à cet email.</p>
        </div>
    </div>
</body>
</html>

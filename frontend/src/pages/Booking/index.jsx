import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    Info,
    CheckCircle2,
    CreditCard,
    Clock,
    ShieldCheck,
    AlertTriangle,
    Map
} from 'lucide-react';
import { api } from '../../services/api';
import { generateTicketPDF } from '../../utils/pdfGenerator';

const Booking = () => {
    const { flightId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [flight, setFlight] = useState(null);
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [bookingStatus, setBookingStatus] = useState('selection'); // selection, confirming, success
    const [confirmedPassenger, setConfirmedPassenger] = useState(null);

    // User data and modal
    const [showUserModal, setShowUserModal] = useState(false);
    const [userName, setUserName] = useState('');
    const [userID, setUserID] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [actionType, setActionType] = useState(null); // 'reserve' or 'book'

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const flightData = await api.getFlight(flightId);
                setFlight(flightData);

                if (flightData.seats) {
                    const seatsArray = (Array.isArray(flightData.seats)
                        ? flightData.seats
                        : Object.values(flightData.seats)
                    ).map(s => ({
                        id: s.seatNumber,
                        type: s.seatType,
                        status: s.status,
                        price: s.price
                    }));
                    setSeats(seatsArray);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [flightId]);

    const handleSeatClick = (seat) => {
        if (seat.status === 'AVAILABLE') {
            setSelectedSeat(selectedSeat?.id === seat.id ? null : seat);
        }
    };

    const handleOpenUserModal = (action) => {
        if (!selectedSeat) return;
        setActionType(action);
        setShowUserModal(true);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        if (!userName || !userID || !userEmail) {
            alert(t('booking.please_fill_all_fields') || 'Please fill all fields');
            return;
        }
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            alert(t('booking.invalid_email') || 'Invalid email format');
            return;
        }

        // Guardar valores temporales antes de limpiar
        const tempName = userName;
        const tempID = userID;
        const tempEmail = userEmail;

        setConfirmedPassenger(tempName);
        setShowUserModal(false);
        setUserName('');
        setUserID('');
        setUserEmail('');

        await handleAction(actionType, tempName, tempID, tempEmail);
    };

    const handleAction = async (action, passName, passID, passEmail) => {
        if (!selectedSeat) return;
        setBookingStatus('confirming');
        try {
            if (action === 'reserve') {
                await api.reserveSeat(flightId, selectedSeat.id, passID, passName, passEmail);
            } else {
                await api.bookSeat(flightId, selectedSeat.id, passID, passName, passEmail);
            }
            setBookingStatus('success');
        } catch (err) {
            alert(`Error: ${err.message}`);
            setBookingStatus('selection');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>{t('common.loading')}</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '100px', color: 'hsl(var(--danger))' }}>{t('common.error')}: {error}</div>;

    if (bookingStatus === 'success') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <div className="animate-fade" style={{ padding: '20px', background: 'hsla(var(--success) / 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
                    <CheckCircle2 size={80} color="hsl(var(--success))" />
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{t('common.success')}</h2>
                <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '32px' }}>
                    {t('booking.selected')}: <strong>{selectedSeat.id}</strong>. {flight.flightNumber} - {flight.origin} → {flight.destination}.
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={() => generateTicketPDF({ flight, seat: selectedSeat, user: confirmedPassenger })} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CreditCard size={18} />
                        <span>{t('booking.download_pdf')}</span>
                    </button>
                    <button onClick={() => navigate('/')} className="glass-light" style={{ padding: '0 24px', borderRadius: 'var(--radius-md)' }}>{t('booking.return_home')}</button>
                </div>
            </div>
        );
    }



    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', height: '100%' }}>
            {/* Left: Seat Map */}
            <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', overflowY: 'auto' }}>
                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-muted))', padding: '0', background: 'none', marginBottom: '24px' }}>
                    <ChevronLeft size={18} />
                    <span>{t('common.back')}</span>
                </button>

                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('booking.seat_map')}</div>
                        <h2 style={{ fontSize: '1.75rem' }}>{flight.aircraft?.includes('Escalas Optimizada') ? t('booking.aircraft_optimized', '') : flight.aircraft}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Legend color="var(--success)" label={t('booking.available')} />
                        <Legend color="var(--warning)" label={t('booking.reserved')} />
                        <Legend color="var(--danger)" label={t('booking.occupied')} />
                        <Legend color="var(--primary)" label={t('booking.selected')} />
                    </div>
                </header>

                {/* Aircraft Body */}
                <div style={{
                    maxWidth: '500px',
                    margin: '0 auto',
                    background: 'hsla(var(--bg-main) / 0.3)',
                    borderRadius: '100px 100px 40px 40px',
                    border: '2px solid hsl(var(--border))',
                    padding: '80px 40px 40px'
                }}>
                    {/* Section: First Class */}
                    <SeatGrid seats={seats.filter(s => s.type === 'FIRST_CLASS')} cols={4} onSeatClick={handleSeatClick} selectedId={selectedSeat?.id} />
                    <div style={{ textAlign: 'center', margin: '32px 0', color: 'hsl(var(--text-dim))', fontSize: '0.75rem', fontWeight: 'bold' }}>{t('booking.header_first_class', '--- FIRST CLASS ---')}</div>
                    <SeatGrid seats={seats.filter(s => s.type === 'BUSINESS_CLASS')} cols={6} onSeatClick={handleSeatClick} selectedId={selectedSeat?.id} />
                    <div style={{ textAlign: 'center', margin: '32px 0', color: 'hsl(var(--text-dim))', fontSize: '0.75rem', fontWeight: 'bold' }}>{t('booking.header_business_class', '--- BUSINESS CLASS ---')}</div>
                    <SeatGrid seats={seats.filter(s => s.type === 'ECONOMY_CLASS')} cols={6} onSeatClick={handleSeatClick} selectedId={selectedSeat?.id} />
                </div>
            </div>

            {/* Right: Summary Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ marginBottom: '20px' }}>{t('booking.summary')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <SummaryItem icon={<ChevronLeft size={16} rotate={90} />} label={t('common.flight', 'Vuelo')} value={flight.flightNumber} />
                        <SummaryItem icon={<Clock size={16} />} label={t('common.time', 'Hora')} value={flight.departureTime?.split('T')[1]?.substring(0, 5) + 'Z'} />
                        <SummaryItem icon={<Map size={16} />} label={t('common.date', 'Fecha')} value={flight.departureTime?.split('T')[0]} />
                        <SummaryItem icon={<CreditCard size={16} />} label={t('booking.base_price', 'Precio Base')} value={`$${flight.price}`} />
                    </div>
                </div>

                <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: selectedSeat ? '1px solid hsla(var(--primary) / 0.5)' : '1px solid transparent' }}>
                    <h3 style={{ marginBottom: '20px' }}>{t('booking.selected')}</h3>
                    {selectedSeat ? (
                        <div className="animate-fade">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{selectedSeat.id}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{selectedSeat.type} CLASS</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'hsl(var(--accent))' }}>${selectedSeat.price}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>Impuestos incl.</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button onClick={() => handleOpenUserModal('reserve')} className="glass-light" style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', fontWeight: '600' }} disabled={bookingStatus === 'confirming'}>
                                    {bookingStatus === 'confirming' ? t('common.loading') : t('booking.reserve')}
                                </button>
                                <button onClick={() => handleOpenUserModal('book')} className="btn-primary" style={{ width: '100%', padding: '14px' }} disabled={bookingStatus === 'confirming'}>
                                    {bookingStatus === 'confirming' ? t('common.loading') : t('booking.buy')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-dim))', fontSize: '0.875rem' }}>
                            {t('booking.please_select_seat', 'Por favor selecciona un asiento disponible en el mapa.')}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 'auto', padding: '16px', background: 'hsla(var(--primary) / 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid hsla(var(--primary) / 0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <ShieldCheck size={20} color="hsl(var(--primary))" />
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                            <strong>{t('booking.secure_payment', 'Pago Seguro')}:</strong> {t('booking.secure_desc', 'Todas las transacciones están encriptadas y sincronizadas mediante Vector Clocks para evitar sobreventas.')}
                        </div>
                    </div>
                </div>
            </div>

            {/* User Data Modal */}
            {showUserModal && (
                <div className="animate-fade" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="glass" style={{
                        padding: '40px',
                        borderRadius: 'var(--radius-xl)',
                        maxWidth: '450px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                        border: '2px solid hsla(var(--primary) / 0.3)'
                    }}>
                        <h2 style={{ marginBottom: '8px', fontSize: '1.75rem', fontWeight: '700', color: 'white', textAlign: 'center' }}>
                            {t('booking.passenger_info', 'Información del Pasajero')}
                        </h2>
                        <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', marginBottom: '32px', fontSize: '0.875rem' }}>
                            Por favor, ingresa los datos oficiales para la emisión del boleto.
                        </p>

                        <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.85rem', color: 'hsl(var(--text-dim))' }}>
                                    {t('booking.full_name', 'Nombre Completo')}
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="John Doe"
                                    className="input-main glass"
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        color: 'white',
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid hsla(var(--primary) / 0.2)'
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.85rem', color: 'hsl(var(--text-dim))' }}>
                                    {t('booking.passport', 'Pasaporte / ID')}
                                </label>
                                <input
                                    type="text"
                                    value={userID}
                                    onChange={(e) => setUserID(e.target.value)}
                                    placeholder="12345678"
                                    className="input-main glass"
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        color: 'white',
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid hsla(var(--primary) / 0.2)'
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.85rem', color: 'hsl(var(--text-dim))' }}>
                                    {t('booking.email', 'Correo Electrónico')}
                                </label>
                                <input
                                    type="email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="passenger@example.com"
                                    className="input-main glass"
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        color: 'white',
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid hsla(var(--primary) / 0.2)'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUserModal(false);
                                        setUserName('');
                                        setUserID('');
                                        setUserEmail('');
                                    }}
                                    className="glass-light"
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        color: 'white',
                                        border: '1px solid hsla(0, 0%, 100%, 0.1)'
                                    }}
                                >
                                    {t('common.cancel') || 'Cancelar'}
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{
                                        flex: 2,
                                        padding: '14px',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        boxShadow: '0 4px 15px hsla(var(--primary) / 0.4)'
                                    }}
                                >
                                    {t('common.confirm') || 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SeatGrid = ({ seats, cols, onSeatClick, selectedId }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '12px',
        justifyItems: 'center'
    }}>
        {seats.map(seat => (
            <SeatIcon
                key={seat.id}
                seat={seat}
                isSelected={selectedId === seat.id}
                onClick={() => onSeatClick(seat)}
            />
        ))}
    </div>
);

const SeatIcon = ({ seat, isSelected, onClick }) => {
    const isAvailable = seat.status === 'AVAILABLE';
    const isBooked = seat.status === 'BOOKED' || seat.status === 'RESERVED';
    
    // Color mapping
    const colorClass = isSelected ? 'var(--primary)' : 
                       isBooked ? '#ef4444' : 
                       'var(--success)';

    return (
        <div
            onClick={isAvailable ? onClick : undefined}
            style={{
                width: '32px',
                height: '36px',
                background: isSelected ? 'hsl(var(--primary))' : isBooked ? 'rgba(239, 68, 68, 0.2)' : 'hsla(var(--success) / 0.1)',
                border: `1.5px solid ${isSelected ? 'white' : isBooked ? '#ef4444' : 'hsla(var(--success) / 0.4)'}`,
                borderRadius: '6px 6px 2px 2px',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.625rem',
                fontWeight: 'bold',
                color: isSelected ? 'white' : isBooked ? '#ef4444' : 'hsl(var(--success))',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 15px hsla(var(--primary) / 0.4)' : 'none',
                opacity: isAvailable || isSelected ? 1 : 0.8
            }}
            className={isAvailable ? 'seat-hover' : ''}
            title={isBooked ? 'Ocupado' : 'Disponible'}
        >
            {seat.id}
        </div>
    );
};

const Legend = ({ color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
        <div style={{ width: '12px', height: '12px', background: `hsl(${color})`, borderRadius: '3px' }}></div>
        <span>{label}</span>
    </div>
);

const SummaryItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-dim))', fontSize: '0.875rem' }}>
            {icon}
            <span>{label}</span>
        </div>
        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{value}</div>
    </div>
);

export default Booking;

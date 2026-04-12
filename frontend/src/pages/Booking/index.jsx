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
            setConfirmedPassenger({ passName, passID, passEmail });
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
                    <button onClick={() => generateTicketPDF({ flight, seat: selectedSeat, passenger: confirmedPassenger })} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                        <h2 style={{ fontSize: '1.75rem' }}>{flight.aircraft}</h2>
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
                    <div style={{ textAlign: 'center', margin: '32px 0', color: 'hsl(var(--text-dim))', fontSize: '0.75rem', fontWeight: 'bold' }}>--- FIRST CLASS ---</div>
                    <SeatGrid seats={seats.filter(s => s.type === 'BUSINESS_CLASS')} cols={6} onSeatClick={handleSeatClick} selectedId={selectedSeat?.id} />
                    <div style={{ textAlign: 'center', margin: '32px 0', color: 'hsl(var(--text-dim))', fontSize: '0.75rem', fontWeight: 'bold' }}>--- BUSINESS CLASS ---</div>
                    <SeatGrid seats={seats.filter(s => s.type === 'ECONOMY_CLASS')} cols={6} onSeatClick={handleSeatClick} selectedId={selectedSeat?.id} />
                </div>
            </div>

            {/* Right: Summary Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ marginBottom: '20px' }}>{t('booking.summary')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <SummaryItem icon={<ChevronLeft size={16} rotate={90} />} label="Vuelo" value={flight.flightNumber} />
                        <SummaryItem icon={<Clock size={16} />} label="Hora" value={flight.departureTime?.split('T')[1]?.substring(0, 5) + 'Z'} />
                        <SummaryItem icon={<Map size={16} />} label="Fecha" value={flight.departureTime?.split('T')[0]} />
                        <SummaryItem icon={<CreditCard size={16} />} label="Precio Base" value={`$${flight.price}`} />
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
                            Por favor selecciona un asiento disponible en el mapa.
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 'auto', padding: '16px', background: 'hsla(var(--primary) / 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid hsla(var(--primary) / 0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <ShieldCheck size={20} color="hsl(var(--primary))" />
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                            <strong>Pago Seguro:</strong> Todas las transacciones están encriptadas y sincronizadas mediante Vector Clocks para evitar sobreventas.
                        </div>
                    </div>
                </div>
            </div>

            {/* User Data Modal */}
            {showUserModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '700', color: 'hsl(var(--text-main))' }}>
                            Información del Pasajero
                        </h2>
                        
                        <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem' }}>
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="John Doe"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        backgroundColor: 'hsl(var(--bg-main))',
                                        color: 'hsl(var(--text-main))',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem' }}>
                                    Pasaporte / ID
                                </label>
                                <input
                                    type="text"
                                    value={userID}
                                    onChange={(e) => setUserID(e.target.value)}
                                    placeholder="12345678"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        backgroundColor: 'hsl(var(--bg-main))',
                                        color: 'hsl(var(--text-main))',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem' }}>
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="passenger@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        backgroundColor: 'hsl(var(--bg-main))',
                                        color: 'hsl(var(--text-main))',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUserModal(false);
                                        setUserName('');
                                        setUserID('');
                                        setUserEmail('');
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        backgroundColor: 'hsl(var(--surface))',
                                        color: 'hsl(var(--text-main))',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        backgroundColor: 'hsl(var(--primary))',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    {t('common.confirm') || 'Confirm'}
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
    const color = isSelected ? 'var(--primary)' :
        seat.status === 'RESERVED' ? 'var(--warning)' :
            seat.status === 'BOOKED' ? 'var(--danger)' : 'var(--success)';

    return (
        <div
            onClick={onClick}
            style={{
                width: '32px',
                height: '36px',
                background: isSelected ? 'hsl(var(--primary))' : isAvailable ? 'hsla(var(--success) / 0.1)' : 'hsla(white / 0.05)',
                border: `1.5px solid ${isAvailable ? `hsl(${color})` : 'hsl(var(--border))'}`,
                borderRadius: '6px 6px 2px 2px',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.625rem',
                fontWeight: 'bold',
                color: isSelected ? 'white' : isAvailable ? `hsl(${color})` : 'hsl(var(--text-dim))',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 15px hsla(var(--primary) / 0.4)' : 'none'
            }}
            className={isAvailable ? 'seat-hover' : ''}
        >
            {seat.id}
            <style>{`
        .seat-hover:hover {
          transform: translateY(-2px);
          filter: brightness(1.2);
          box-shadow: 0 4px 10px hsla(var(--primary) / 0.2);
        }
      `}</style>
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

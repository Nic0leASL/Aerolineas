/**
 * DashboardCard Component
 * Reusable card for displaying dashboard metrics
 */

export const DashboardCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        orange: 'bg-orange-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500'
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
            <div className={`${colors[color]} rounded-full p-4 text-white`}>
                {Icon && <Icon size={24} />}
            </div>
            <div>
                <p className="text-gray-600 text-sm">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
};

export default DashboardCard;

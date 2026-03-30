import { useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, Scale, ShieldCheck, LogOut } from 'lucide-react';

const AdminPanel = () => {
    const navigate = useNavigate();

    const menuItems = [
        { 
            title: "User Management", 
            desc: "Add, edit, or remove dashboard users", 
            icon: <Users size={32} />, 
            path: "/manage-users",
            color: "bg-blue-600"
        },
        { 
            title: "View Dashboards", 
            desc: "Access live KW&SC monitoring", 
            icon: <LayoutDashboard size={32} />, 
            path: "/select",
            color: "bg-emerald-600"
        },

        { 
        title: "LCMS Management", 
        desc: "Import Excel & update court cases", 
        icon: <Scale size={32} />, 
        path: "/admin/lcms", 
        color: "bg-purple-600"
        },
      
    ];

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-blue-100 text-blue-600">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Console</h1>
                            <p className="text-slate-500 font-medium">Internal Management System</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { sessionStorage.clear(); navigate('/'); }}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item, idx) => (
                        <div 
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className="bg-white p-6 rounded-3xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                        >
                            <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
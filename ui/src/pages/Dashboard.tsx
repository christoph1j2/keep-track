import { useState } from "react";
import { BaseModal } from "../components/BaseModal";
import { StatCard } from "../components/StatCard";
import { TrendingUp, TrendingDown, CalendarMonth, Euro } from "@mui/icons-material";

export function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const income = 12345; // GET FROM API
    const expenses = 6789; // GET FROM API
    const balance = income - expenses; // CALCULATE BALANCE

    return (
        <>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>

        {/** stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
            <StatCard 
                title="Příjmy tento měsíc"
                amount={income}
                icon={<TrendingUp />}
                trend={true}
            />
            <StatCard 
                title="Výdaje tento měsíc"
                amount={expenses}
                icon={<TrendingDown />}
                trend={false}
            />
            <StatCard
                title="Bilance tento měsíc"
                amount={balance}
                icon={<Euro />}
            />
            <StatCard 
                title="Rozpočet tento měsíc"
                budget_status="OK" // GOOD, BAD, OK, //TODO based on the budgeting in the budgeting tab
                icon={<CalendarMonth />}
            
            />
        </div>






        <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={() => {
                setIsModalOpen(true);
            }}
        >
            open test window
        </button>
        
        <BaseModal
            title="Moje první okno!"
            isOpen={isModalOpen}
            onClose={()=>{
                setIsModalOpen(false);
            }}
        >
            <p>obsah uvnitr modalu</p>
        </BaseModal>
        
        <p className="mt-4 text-slate-600">Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum recusandae aliquid consectetur sed voluptatem placeat voluptates ea, nisi corporis quod provident doloremque molestias at ad doloribus pariatur iste. Eaque, facilis.</p>
        </>
    )
}
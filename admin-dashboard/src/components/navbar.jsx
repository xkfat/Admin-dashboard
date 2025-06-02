import { AlignJustify,Bell ,Moon,LogOut} from 'lucide-react';



export default function Navbar({ onLogout ,onToggleSidebar}) {
return  (
    <nav className="bg-findthem-bg  shadow-sm p-6 mb-8 w-full h-20 flex justify-between items-center">
            <button onClick={onToggleSidebar}>

        <AlignJustify color='white'  />
        </button>
        <h1 className="text-2xl font-semibold  text-white text-center">Admin Dashboard</h1>
        <div className='flex gap-4'>
             <Bell  color='white' />
             <Moon color='white' />
          
        <button
          onClick={onLogout}
          
        >
          <LogOut  color='white' />
        </button>
        </div>
     
      
    </nav>
)
}
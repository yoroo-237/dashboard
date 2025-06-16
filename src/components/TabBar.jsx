import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiUsers,
  FiPackage,
  FiBookOpen,
  FiBarChart2,
  FiFileText,
  FiSettings
} from 'react-icons/fi';
import { FaCommentDots } from "react-icons/fa";
export default function TabBar({ isAdmin }) {
  // base pour les routes absolues
  const base = '/home';

  const tabs = [
    { to: `${base}/products`,   icon: <FiPackage/>,   label: 'Produits' },
    { to: `${base}/blogs`,      icon: <FiBookOpen/>,  label: 'Blogs' },
    { to: `${base}/reviews`,   icon: <FaCommentDots/>,  label: 'Commentaires' },
    { to: `${base}/statistics`, icon: <FiBarChart2/>, label: 'Stats' },
    
  ];

  if (isAdmin) {
    tabs.unshift({ to: `${base}/users`, icon: <FiUsers/>, label: 'Utilisateurs' });
  }

  return (
    <nav className="tabbar">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => isActive ? 'active' : undefined}
        >
          <div className="icon">{tab.icon}</div>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

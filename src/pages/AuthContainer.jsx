import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Signup from './signup';
import Login  from './login';

export default function AuthContainer({ mode, theme, setTheme }) {
  const [isLogin, setIsLogin] = React.useState(mode === 'login');

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <div className="side-design left" />
      <div className="side-design right" />
      <div className="bg-bubble1" />
      <div className="bg-bubble2" />

      <AnimatePresence>
        {isLogin ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <Login toggle={() => setIsLogin(false)} theme={theme} setTheme={setTheme} />
          </motion.div>
        ) : (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <Signup toggle={() => setIsLogin(true)} theme={theme} setTheme={setTheme} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

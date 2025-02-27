import React from 'react';

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            About VoiceNav
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Revolutionizing web navigation through the power of voice commands
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9">
                <div className="w-full h-full bg-blue-500 rounded-lg shadow-lg flex items-center justify-center">
                  <svg className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                At VoiceNav, we believe in making web navigation as natural as having a conversation. Our advanced voice recognition technology allows you to browse the internet effortlessly, without touching your keyboard or mouse.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Whether you're multitasking, have limited mobility, or simply prefer voice commands, VoiceNav provides a seamless and intuitive way to navigate the web.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">50+</div>
                  <div className="text-gray-600">Voice Commands</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">100K+</div>
                  <div className="text-gray-600">Happy Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

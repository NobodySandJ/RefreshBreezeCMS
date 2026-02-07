import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const StoryPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-black text-center mb-8">OUR STORY</h1>
        <div className="max-w-3xl mx-auto space-y-6 text-gray-700 leading-relaxed font-medium">
            <p>
                Refresh Breeze lahir dari semangat muda Tulungagung pada tahun 2023. Kami adalah sekelompok individu yang disatukan oleh kecintaan terhadap musik dan budaya pop Jepang.
            </p>
            <p>
                Nama "Refresh Breeze" melambangkan angin segar yang kami harap dapat kami bawa ke industri musik lokal. Kami ingin menjadi sumber energi positif dan kegembiraan bagi semua orang yang menyaksikan penampilan kami.
            </p>
            <p>
                Perjalanan kami baru saja dimulai, dan kami sangat berterima kasih kepada semua penggemar yang telah mendukung kami sejak awal. Mari terus melangkah bersama menuju masa depan yang cerah!
            </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StoryPage;

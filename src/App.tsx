import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SignInForm } from './SignInForm';
import { SignOutButton } from './SignOutButton';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { StreamPage } from './StreamPage';
import { MyPhotosPage } from './MyPhotosPage';
import { ImageUpload } from './ImageUpload';
import { ProfileImageUpload } from './ProfileImageUpload';
import { SingleImageViewPage } from './SingleImageViewPage';
import { Id } from '../convex/_generated/dataModel';

type Tab = 'stream' | 'myPhotos' | 'upload';
type Theme = 'light' | 'dark';

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme) return storedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const currentUserProfileImageUrl = useQuery(
    api.userProfiles.getCurrentUserProfileImageUrl
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground scroll-smooth">
      <header className="header-container">
        <h2 className="header-title">Vitrine Pro</h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-md hover:bg-muted transition-colors focus-visible"
            aria-label={
              theme === 'light'
                ? 'Passer au mode sombre'
                : 'Passer au mode clair'
            }
          >
            {theme === 'light' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6 text-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m0 13.5V21M4.22 6.364l1.591 1.591M18.189 16.046l1.591 1.591M3.75 12H6m12 0h2.25M6.364 19.78l1.591-1.591M16.046 4.811l1.591-1.591M12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6 text-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21c3.978 0 7.44-2.39 9.002-5.998Z"
                />
              </svg>
            )}
          </button>
          <Authenticated>
            <button
              onClick={() => setShowProfileUpload(true)}
              className="p-1 rounded-full hover:bg-muted transition-colors focus-visible"
            >
              {currentUserProfileImageUrl ? (
                <img
                  src={currentUserProfileImageUrl}
                  alt="My Profile"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
              )}
            </button>
          </Authenticated>
          <SignOutButton />
        </div>
      </header>
      <main className="main-content">
        <div className="content-container">
          <Content />
        </div>
      </main>
      <Toaster theme={theme} />
      {showProfileUpload && (
        <ProfileImageUpload
          onClose={() => setShowProfileUpload(false)}
          currentImageUrl={currentUserProfileImageUrl}
        />
      )}
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [activeTab, setActiveTab] = useState<Tab>('stream');
  const [sharedImageId, setSharedImageId] = useState<Id<'images'> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const imageIdFromUrl = params.get('imageId') as Id<'images'> | null;
    if (imageIdFromUrl) {
      setSharedImageId(imageIdFromUrl);
    }
  }, []);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sharedImageId) {
    return <SingleImageViewPage imageId={sharedImageId} />;
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-3 sm:px-4">
          <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 space-y-4 sm:space-y-6 bg-card rounded-xl shadow-xl">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                Bienvenue sur Vitrine Pro!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Connectez-vous pour partager et profiter des services des
                entrepeneurs incroyables.
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <nav className="flex justify-center gap-1 sm:gap-2 md:gap-4 mb-6 sm:mb-8 px-2">
          {(['stream', 'myPhotos', 'upload'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-md font-medium transition-colors text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-0
                ${activeTab === tab ? 'nav-button-active' : 'nav-button-inactive'}`}
            >
              <span className="truncate">
                {tab === 'stream' && "Fil d'actualité"}
                {tab === 'myPhotos' && 'Mes Services'}
                {tab === 'upload' && 'Publier'}
              </span>
            </button>
          ))}
        </nav>

        {activeTab === 'stream' && <StreamPage />}
        {activeTab === 'myPhotos' && <MyPhotosPage />}
        {activeTab === 'upload' && (
          <ImageUpload onSuccess={() => setActiveTab('myPhotos')} />
        )}
      </Authenticated>
    </div>
  );
}

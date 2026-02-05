import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { User, Mail, Camera, Save, Loader2, Key, Shield } from 'lucide-react';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';

const Profile: React.FC = () => {
    const { currentUser, setCurrentUser } = useStore();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            // Check if user has password provider linked
            const passwordProvider = auth.currentUser?.providerData.some(p => p.providerId === 'password');
            setHasPassword(!!passwordProvider);
        }
    }, [currentUser]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !auth.currentUser) return;

        setIsLoading(true);
        try {
            const storageRef = ref(storage, `avatars/${auth.currentUser.uid}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await updateProfile(auth.currentUser, { photoURL: downloadURL });

            if (currentUser) {
                setCurrentUser({ ...currentUser, avatar: downloadURL });
            }
            toast.success('Profile picture updated!');
        } catch (error) {
            console.error("Error uploading avatar:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setIsLoading(true);
        try {
            await updateProfile(auth.currentUser, {
                displayName: name
            });

            // Update store
            if (currentUser) {
                setCurrentUser({
                    ...currentUser,
                    name: name
                });
            }

            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLinkPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !currentUser) return;

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, password);
            await linkWithCredential(auth.currentUser, credential);
            setHasPassword(true);
            setPassword('');
            setConfirmPassword('');
            toast.success('Email login linked successfully! You can now use this password on mobile.');
        } catch (error: any) {
            console.error('Error linking password:', error);
            if (error.code === 'auth/credential-already-in-use') {
                toast.error('This email is already linked to another account.');
            } else {
                toast.error(error.message || 'Failed to link password');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Personal Information</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your personal details.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                        <div className="flex items-center space-x-6">
                            <div className="shrink-0 relative group">
                                <img
                                    className="h-24 w-24 object-cover rounded-full ring-4 ring-gray-100"
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                />
                                <div
                                    onClick={handleAvatarClick}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{currentUser.name}</h3>
                                <p className="text-sm text-gray-500">{currentUser.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={currentUser.email}
                                        disabled
                                        className="bg-gray-50 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                ) : (
                                    <Save className="-ml-1 mr-2 h-4 w-4" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Security Settings Section */}
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-blue" />
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Security & Access</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Enable email & password login for this account.</p>
                    </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    {hasPassword ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <Key size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-800 text-sm">Email Login Enabled</h4>
                                <p className="text-xs text-green-700 mt-0.5">You can now sign in on mobile devices using your email and password.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleLinkPassword} className="space-y-4 max-w-md">
                            <p className="text-sm text-gray-600 mb-4">
                                Linked with Google on laptop? Set a password below to log in on mobile.
                            </p>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Set Password</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="New password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirm Password</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Enable Email Password Login'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;

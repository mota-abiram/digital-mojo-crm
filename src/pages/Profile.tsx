import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { User, Mail, Camera, Save, Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
    const { currentUser, setCurrentUser } = useStore();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
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
        </div>
    );
};

export default Profile;

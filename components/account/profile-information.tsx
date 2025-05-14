'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/components/ui/use-toast';

export default function ProfileInformation() {
  const { data: session } = useSession();
  const { profile, isLoading, error, updateProfile, isUpdating } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    jobRole: ''
  });
  const { toast } = useToast();

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        company: profile.company,
        jobRole: profile.jobRole
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    const success = await updateProfile(formData);
    
    if (success) {
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
        variant: "default"
      });
    } else {
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-background rounded-lg border border-border p-6 h-full">
       <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

            <div className="flex justify-between items-center mb-6">
                {!isEditing ? (
                <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    size="sm"
                >
                    Edit Profile
                </Button>
                ) : (
                <div className="space-x-2">
                    <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    size="sm"
                    >
                    Cancel
                    </Button>
                    <Button 
                    onClick={handleSave}
                    disabled={isLoading}
                    size="sm"
                    >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
                )}
            </div>
        </div>
        
        {profile && 
            <div className="space-y-4">
                <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing || isLoading}
                    placeholder="Enter your full name"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                    id="email"
                    name="email"
                    value={session?.user?.email || ''}
                    disabled={true}
                    placeholder="Your email address"
                    className="bg-gray-50 dark:bg-gray-800"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed as it is linked to your account
                    </p>
                </div>
                </div>
                
                <div className="grid  gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your company name"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="jobRole">Job Role</Label>
                    <Input
                    id="jobRole"
                    name="jobRole"
                    value={formData.jobRole}
                    onChange={handleChange}
                    disabled={!isEditing || isLoading}
                    placeholder="Enter your job role"
                    />
                </div>
                </div>
            </div>
        }

        {!profile && 
            <div className="flex flex-col items-center justify-center p-6 bg-background rounded-lg border border-border">
                <h3 className="text-lg font-medium mb-3">No profile information available</h3>
                <p className="text-sm text-muted-foreground">Please fill out your profile information.</p>
            </div>
        }
        
    </div>
  );
}

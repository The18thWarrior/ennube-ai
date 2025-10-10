'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface User {
  user_id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  app_metadata?: {
    role?: string;
    parentAccount?: string;
  };
  user_metadata?: Record<string, any>;
  status?: 'active' | 'inactive';
}

export default function UserDetailPage({ params }: { params: Promise<{ subId: string }> }) {
  const router = useRouter();
  const {subId} = use(params);
  const userId = decodeURI(subId);
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // User form state
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    status: 'active' as 'active' | 'inactive'
  });
  
  // Fetch user details on component mount
  useEffect(() => {
    async function fetchUserDetails() {
      try {
        setIsLoading(true);
        
        // Get all users and find the specific one we need
        // (assuming the API doesn't have a "get user by ID" endpoint yet)
        const response = await fetch('/api/account/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        const userDetail = (data.users || []).find((u: User) => u.user_id === userId);
        
        if (!userDetail) {
          throw new Error('User not found');
        }
        
        setUser(userDetail);
        
        // Initialize form with user data
        setUserForm({
          firstName: userDetail.given_name || '',
          lastName: userDetail.family_name || '',
          email: userDetail.email || '',
          role: userDetail.app_metadata?.role || 'user',
          status: userDetail.status || 'active'
        });
      } catch (error) {
        console.log('Error fetching user details:', error);
        toast.error('Failed to load user details');
        router.push('/account/users');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (userId) {
      fetchUserDetails();
    }
  }, [userId, router]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle role selection change
  const handleRoleChange = (role: string) => {
    setUserForm(prev => ({ ...prev, role }));
  };
  
  // Handle status toggle
  const handleStatusToggle = (checked: boolean) => {
    setUserForm(prev => ({
      ...prev,
      status: checked ? 'active' : 'inactive'
    }));
  };
  
  // Handle save user changes
  const handleSaveUser = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/account/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          email: userForm.email,
          role: userForm.role,
          status: userForm.status
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      
      const data = await response.json();
      setUser(data.user);
      
      toast.success('User updated successfully');
    } catch (error: any) {
      console.log('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/account/users?userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      toast.success('User deleted successfully');
      router.push('/account/users');
    } catch (error) {
      console.log('Error deleting user:', error);
      toast.error('Failed to delete user');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-pulse">Loading user details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant={theme === 'dark' ? 'ghost' : 'outline'}
          size="sm"
          onClick={() => router.push('/account/users')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Users
        </Button>
        <h2 className="text-2xl font-bold">Edit User</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={userForm.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={userForm.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={userForm.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="status">Active Status</Label>
                <div className="text-sm text-muted-foreground">
                  {userForm.status === 'active' 
                    ? 'User can access the system' 
                    : 'User access is disabled'}
                </div>
              </div>
              <Switch
                id="status"
                checked={userForm.status === 'active'}
                onCheckedChange={handleStatusToggle}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">User ID:</dt>
                  <dd className="text-muted-foreground">{user?.user_id}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Last Updated:</dt>
                  <dd className="text-muted-foreground">
                    {user?.user_metadata?.lastUpdated 
                      ? new Date(user.user_metadata.lastUpdated).toLocaleString() 
                      : 'N/A'}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Created By:</dt>
                  <dd className="text-muted-foreground">
                    {user?.user_metadata?.createdBy || 'N/A'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          <div className="flex gap-4 justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash size={16} />
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
            
            <Button
              onClick={handleSaveUser}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

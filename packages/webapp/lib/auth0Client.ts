/**
 * Auth0Manager - A class for managing Auth0 users and their associated licenses
 * 
 * This class provides methods for creating and managing secondary users
 * and their license relationships with the primary account.
 */
import { ManagementClient, RequiredError } from 'auth0';
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { createLicense, updateLicenseParent, LicenseStatus, updateLicenseStatus } from '@/lib/db/license-storage';

// Define our own User interface to match Auth0 user structure
export interface Auth0User {
  user_id?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  [key: string]: any;
}

// Define interfaces for user creation and update
export interface CreateUserParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  metadata?: Record<string, any>;
  status?: LicenseStatus;
}

export const auth0 = new Auth0Client();
export const auth = () => auth0.getSession();

class Auth0Manager {
  private managementClient: ManagementClient;

  constructor() {
    // Initialize the Auth0 Management API client
    this.managementClient = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN || '',
      clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID || '',
    //   clientId: process.env.AUTH0_CLIENT_ID || '',
    //   clientSecret: process.env.AUTH_AUTH0_SECRET || '',
      //token
      clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET || '',
    });
    // console.log('Auth0Manager initialized with token:');
    // this.managementClient.stats.getActiveUsersCount().then((result) => {
    //     console.log('Active users count:', result.data);
    // }).catch((error) => {
    //     console.log('Error fetching active users count:', error)
    // });
  }

  /**
   * Create a secondary user and associate them with the current user via license
   */
  async createSecondaryUser(params: CreateUserParams): Promise<Auth0User | unknown> {
    try {
      // Get the current user's session to extract their sub ID
      const session = await auth();
      if (!session?.user.sub) {
        throw new Error('No authenticated user found');
      }
      
      const parentSubId = session.user.sub;
      
      // Create the user in Auth0
      const response = await this.managementClient.users.create({
        email: params.email,
        password: params.password,
        connection: 'Username-Password-Authentication',
        name: `${params.firstName} ${params.lastName}`,
        given_name: params.firstName,
        family_name: params.lastName,
        user_metadata: {
          ...params.metadata,
          createdBy: parentSubId
        },
        app_metadata: {
          role: params.role || 'user',
          parentAccount: parentSubId
        }
      });
      
      // Extract the user data from the response
      const newUser = response.data as unknown as Auth0User;
      
      if (!newUser?.user_id) {
        throw new Error('Failed to create user in Auth0');
      }
      
      // Create a license record linking the new user to the parent
      await createLicense(
        newUser.user_id,
        parentSubId,
        'active'
      );
      
      console.log(`Secondary user created: ${newUser.email} (${newUser.user_id})`);
      return newUser;
    } catch (error: RequiredError | any) {
      console.log('Error creating secondary user:', error);
      return error.msg as string || 'Error creating secondary user';
    }
  }

  /**
   * Update a secondary user's information
   */
  async updateSecondaryUser(userId: string, params: UpdateUserParams): Promise<Auth0User | null> {
    try {
      // Validate that the current user is the parent of this user
      const session = await auth();
      if (!session?.user.sub) {
        throw new Error('No authenticated user found');
      }
      
      const parentSubId = session.user.sub;
      
      // Build update object for Auth0
      const updateData: any = {};
      
      if (params.firstName || params.lastName) {
        updateData.name = `${params.firstName || ''} ${params.lastName || ''}`.trim();
      }
      
      if (params.firstName) {
        updateData.given_name = params.firstName;
      }
      
      if (params.lastName) {
        updateData.family_name = params.lastName;
      }
      
      if (params.email) {
        updateData.email = params.email;
      }
      
      if (params.metadata) {
        updateData.user_metadata = params.metadata;
      }
      
      if (params.role) {
        updateData.app_metadata = {
          role: params.role,
          parentAccount: parentSubId
        };
      }
      
      // Update user in Auth0
      const response = await this.managementClient.users.update(
        { id: userId },
        updateData
      );
      
      // Extract the user data from the response
      const updatedUser = response.data as unknown as Auth0User;
      
      // Update license status if provided
      if (params.status) {
        await updateLicenseStatus(userId, params.status);
      }
      
      console.log(`Secondary user updated: ${updatedUser.email} (${updatedUser.user_id})`);
      return updatedUser;
    } catch (error) {
      console.log('Error updating secondary user:', error);
      return null;
    }
  }

  /**
   * List all secondary users associated with the current user
   */
  async getSecondaryUsers(): Promise<Auth0User[]> {
    try {
      const session = await auth();
      if (!session?.user.sub) {
        throw new Error('No authenticated user found');
      }
      
      const parentSubId = session.user.sub;
      
      // Query for users with this parent account using Auth0 Management API
      console.log(`Fetching secondary users for parent account: ${parentSubId}`);
      const response = await this.managementClient.users.getAll({
        q: `app_metadata.parentAccount:"${parentSubId}"`,
        search_engine: 'v3'
      });
      
      // Extract the users array from the response
      const users = (response.data as unknown as Auth0User[]) || [];
      
      return users;
    } catch (error) {
      console.log('Error getting secondary users:',);
      return [];
    }
  }

  /**
   * Delete a secondary user and their license
   */
  async deleteSecondaryUser(userId: string): Promise<boolean> {
    try {
      // Validate that the current user is the parent of this user
      const session = await auth();
      if (!session?.user.sub) {
        throw new Error('No authenticated user found');
      }
      
      // First deactivate the license by setting status to inactive
      await updateLicenseStatus(userId, 'inactive');
      
      // Then delete the user from Auth0
      await this.managementClient.users.delete({ id: userId });
      
      console.log(`Secondary user deleted: ${userId}`);
      return true;
    } catch (error) {
      console.log('Error deleting secondary user:', error);
      return false;
    }
  }

  /**
   * Transfer secondary users from one parent to another
   */
  async transferSecondaryUsers(newParentSubId: string): Promise<number> {
    try {
      const session = await auth();
      if (!session?.user.sub) {
        throw new Error('No authenticated user found');
      }
      
      const oldParentSubId = session.user.sub;
      
      // Get all users with the current parent
      const response = await this.managementClient.users.getAll({
        q: `app_metadata.parentAccount:"${oldParentSubId}"`,
        search_engine: 'v3'
      });
      
      // Extract the users array from the response
      const users = (response.data as unknown as Auth0User[]) || [];
      
      // Update each user's parent in Auth0 and in the license table
      let updateCount = 0;
      
      for (const user of users) {
        if (!user.user_id) continue;
        
        // Update the app_metadata
        const appMetadata = user.app_metadata || {};
        appMetadata.parentAccount = newParentSubId;
        
        await this.managementClient.users.update(
          { id: user.user_id },
          { app_metadata: appMetadata }
        );
        
        // Update the license record
        await updateLicenseParent(user.user_id, newParentSubId);
        updateCount++;
      }
      
      console.log(`Transferred ${updateCount} secondary users to new parent: ${newParentSubId}`);
      return updateCount;
    } catch (error) {
      console.log('Error transferring secondary users:', error);
      return 0;
    }
  }
}

export async function getToken() {
  try {
    const url = `${process.env.AUTH_AUTH0_ISSUER}/oauth/token`;
    console.log('Fetching Auth0 token from:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          "client_id": process.env.AUTH_AUTH0_ID,
          "client_secret": process.env.AUTH_AUTH0_SECRET,
          "audience": process.env.AUTH0_MANAGEMENT_ISSUER,
          "grant_type": "client_credentials"
        }),
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data.access_token;
  } catch (error) {
      console.log('Error fetching token:', error);
      return null;
  }
};
// Export a singleton instance of the Auth0Manager
//export const auth0Manager = new Auth0Manager();

// export const auth0Manager = async () => {
//   const token = await getToken();
//   //console.log('Auth0 token retrieved:', token);
//   return new Auth0Manager();
// };
export const auth0Manager = new Auth0Manager();


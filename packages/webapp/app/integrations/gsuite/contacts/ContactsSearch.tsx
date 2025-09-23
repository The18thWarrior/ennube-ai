"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, Mail, Building, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Contact {
  resourceName: string;
  etag: string;
  names?: {
    displayName: string;
    familyName: string;
    givenName: string;
  }[];
  emailAddresses?: {
    value: string;
    type: string;
  }[];
  phoneNumbers?: {
    value: string;
    type: string;
  }[];
  organizations?: {
    name: string;
    title: string;
  }[];
  addresses?: {
    formattedValue: string;
    type: string;
  }[];
  photos?: {
    url: string;
  }[];
}

export default function ContactsSearch() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchContacts = async () => {
    if (!query) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gsuite/contacts/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Error searching contacts: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.contacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while searching contacts");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (contact: Contact) => {
    if (contact.names && contact.names.length > 0) {
      const name = contact.names[0].displayName;
      return name
        .split(' ')
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    return 'CT';
  };

  const getDisplayName = (contact: Contact) => {
    return contact.names && contact.names.length > 0
      ? contact.names[0].displayName
      : "No Name";
  };

  const getEmailAddresses = (contact: Contact) => {
    return contact.emailAddresses && contact.emailAddresses.length > 0
      ? contact.emailAddresses
      : [];
  };

  const getPhoneNumbers = (contact: Contact) => {
    return contact.phoneNumbers && contact.phoneNumbers.length > 0
      ? contact.phoneNumbers
      : [];
  };

  const getOrganization = (contact: Contact) => {
    return contact.organizations && contact.organizations.length > 0
      ? contact.organizations[0]
      : null;
  };

  const getAddress = (contact: Contact) => {
    return contact.addresses && contact.addresses.length > 0
      ? contact.addresses[0].formattedValue
      : null;
  };

  const getPhotoUrl = (contact: Contact) => {
    return contact.photos && contact.photos.length > 0
      ? contact.photos[0].url
      : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          placeholder="Search contacts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchContacts()}
        />
        <Button onClick={searchContacts} disabled={isLoading || !query}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {searchResults.length === 0 && !isLoading ? (
        <p className="text-center py-8 text-muted-foreground">No contacts found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {searchResults.map((contact) => (
            <Card key={contact.resourceName} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getPhotoUrl(contact) || ''} alt={getDisplayName(contact)} />
                    <AvatarFallback>{getInitials(contact)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{getDisplayName(contact)}</h3>
                    {getOrganization(contact) && (
                      <p className="text-sm text-muted-foreground">{getOrganization(contact)?.title || ''}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {getEmailAddresses(contact).map((email, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted" />
                      <span>{email.value}</span>
                      {email.type && <span className="text-xs text-muted-foreground">({email.type})</span>}
                    </div>
                  ))}

                  {getPhoneNumbers(contact).map((phone, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted" />
                      <span>{phone.value}</span>
                      {phone.type && <span className="text-xs text-muted-foreground">({phone.type})</span>}
                    </div>
                  ))}

                  {getOrganization(contact) && getOrganization(contact)?.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted" />
                      <span>{getOrganization(contact)?.name}</span>
                    </div>
                  )}

                  {getAddress(contact) && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted mt-1" />
                      <span>{getAddress(contact)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

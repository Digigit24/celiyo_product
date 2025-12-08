
// src/pages/Contacts.tsx
import { useState } from 'react';
import { useContacts, useContactMutations } from '@/hooks/whatsapp/useContacts';
import type { ContactsListQuery, Contact } from '@/types/whatsappTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Plus, Search, X, ArrowLeft, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { toast } from 'sonner';

import ContactsFiltersDrawer from '@/components/ContactsFiltersDrawer';
import ContactsTable from '@/components/ContactsTable';
import ContactsFormDrawer from '@/components/ContactsFormDrawer';

export default function Contacts() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ContactsListQuery>({
    limit: 100,
    offset: 0,
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Contact Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContactPhone, setSelectedContactPhone] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('view');

  const { contacts, total, isLoading, error, revalidate } = useContacts(filters);
  const { deleteContact } = useContactMutations();

  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery, offset: 0 });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({ ...filters, search: undefined, offset: 0 });
  };

  const handleApplyFilters = (newFilters: ContactsListQuery) => {
    setFilters(newFilters);
    setIsFiltersOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters: ContactsListQuery = {
      limit: 100,
      offset: 0,
      search: searchQuery || undefined,
    };
    setFilters(resetFilters);
    setIsFiltersOpen(false);
  };

  // Contact Drawer handlers
  const handleCreateContact = () => {
    setSelectedContactPhone(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContactPhone(contact.phone);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContactPhone(contact.phone);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleDeleteContact = async (contact: Contact) => {
    try {
      await deleteContact(contact.phone);
      toast.success('Contact deleted successfully');
      revalidate();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete contact');
      throw error; // Re-throw to let DataTable handle the error state
    }
  };

  const handleDrawerSuccess = () => {
    revalidate(); // Refresh the list
  };

  const handleRefresh = () => {
    revalidate();
    toast.success('Contacts refreshed');
  };

  if (isLoading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Contacts</h3>
          <p className="text-sm text-destructive/80">{error.message || 'Failed to fetch contact data'}</p>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="mt-4 w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button variant="ghost" size="icon" className="md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">WhatsApp Contacts</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {total} total contacts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size={isMobile ? 'sm' : 'default'}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${!isMobile ? 'mr-2' : ''}`} />
              {!isMobile && 'Refresh'}
            </Button>
            <Button onClick={handleCreateContact} size={isMobile ? 'sm' : 'default'}>
              <Plus className="h-4 w-4 mr-2" />
              {!isMobile && 'Add Contact'}
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 pb-3 md:px-6 md:pb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size={isMobile ? 'icon' : 'default'}>
                  <Filter className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Filters</span>}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side={isMobile ? 'bottom' : 'right'} 
                className={isMobile ? 'h-[90vh]' : 'w-full sm:max-w-md'}
              >
                <ContactsFiltersDrawer
                  filters={filters}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={handleResetFilters}
                  onClose={() => setIsFiltersOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filter Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                Search: {filters.search}
              </span>
            )}
            {filters.labels && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Labels: {filters.labels}
              </span>
            )}
            {filters.groups && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Groups: {filters.groups}
              </span>
            )}
            {filters.limit && filters.limit !== 100 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                Limit: {filters.limit}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto">
        <ContactsTable
          contacts={contacts}
          isLoading={isLoading}
          onView={handleViewContact}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Contact Drawer */}
      <ContactsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        contactPhone={selectedContactPhone}
        mode={drawerMode}
        onSuccess={handleDrawerSuccess}
        onDelete={(phone) => {
          // Handle delete from drawer
          const contact = contacts.find(c => c.phone === phone);
          if (contact) {
            handleDeleteContact(contact);
          }
        }}
        onModeChange={setDrawerMode}
      />
    </div>
  );
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, ActionSheetController, AlertController } from '@ionic/angular';
import { ChatService } from 'src/services/chat/chat.service';
import { ChatSession, ChatContextType } from 'src/services/chat/chat.models';
import { StorageService } from 'src/services/storage/storage.service';
import { GlobalFamilyMemberService } from 'src/services/family-member/global-family-member.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-history',
  templateUrl: './chat-history.page.html',
  styleUrls: ['./chat-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ChatHistoryPage implements OnInit, OnDestroy {
  isLoading = true;
  activeSessions: ChatSession[] = [];
  archivedSessions: ChatSession[] = [];
  showArchived = false;

  private subscriptions = new Subscription();
  private currentFamilyMemberId?: string;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private storageService: StorageService,
    private globalFamilyMemberService: GlobalFamilyMemberService,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private utilityService: UtilityService
  ) {}

  async ngOnInit() {
    // Subscribe to family member changes
    this.subscriptions.add(
      this.globalFamilyMemberService.selectedFamilyMember$.subscribe(async (member) => {
        if (member) {
          this.currentFamilyMemberId = this.globalFamilyMemberService.getMemberId(member);
          await this.loadChatSessions();
        }
      })
    );

    // Initial load
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();
    if (selectedMember) {
      this.currentFamilyMemberId = this.globalFamilyMemberService.getMemberId(selectedMember);
      await this.loadChatSessions();
    } else {
      // Prompt user to select family member
      this.globalFamilyMemberService.requireSelection();
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load chat sessions from the API
   */
  async loadChatSessions() {
    if (!this.currentFamilyMemberId) {
      this.isLoading = false;
      return;
    }

    try {
      this.isLoading = true;

      // Load active sessions
      const activeQuery = {
        familyMemberId: this.currentFamilyMemberId,
        status: 'ACTIVE' as const
      };
      this.activeSessions = await this.chatService.listSessions(activeQuery);

      // Load archived sessions if viewing archived
      if (this.showArchived) {
        const archivedQuery = {
          familyMemberId: this.currentFamilyMemberId,
          status: 'ARCHIVED' as const
        };
        this.archivedSessions = await this.chatService.listSessions(archivedQuery);
      }

    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      this.utilityService.presentToast('Failed to load chats', 2000);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Start a new chat session
   */
  async startNewChat(contextType: ChatContextType, contextId?: string, contextData?: any) {
    if (!this.currentFamilyMemberId) {
      this.utilityService.presentToast('Please select a family member first', 2000);
      this.globalFamilyMemberService.requireSelection();
      return;
    }

    try {
      // Show loading indicator
      this.utilityService.presentToast('Starting chat...', 1000);

      // Launch chat using the service
      await this.chatService.launchChat(contextType, contextId, contextData);
    } catch (error) {
      console.error('Failed to start chat:', error);
      this.utilityService.presentToast('Failed to start chat. Please try again.', 2000);
    }
  }

  /**
   * Navigate to context selection page (for Visit, Appointment, etc.)
   */
  navigateToContext(contextType: ChatContextType) {
    switch (contextType) {
      case 'VISIT':
        // Navigate to visits list to select a visit
        this.router.navigate(['/home/visits']);
        this.utilityService.presentToast('Select a visit to chat about', 2000);
        break;
      case 'APPOINTMENT':
        // Navigate to appointments list
        this.router.navigate(['/home/appointment-list']);
        this.utilityService.presentToast('Select an appointment to chat about', 2000);
        break;
      case 'PRESCRIPTION':
        // Navigate to prescriptions list
        this.router.navigate(['/home/prescription']);
        this.utilityService.presentToast('Select a prescription to chat about', 2000);
        break;
      case 'LAB_REPORT':
        // Navigate to lab reports
        this.utilityService.presentToast('Lab report chat coming soon', 2000);
        break;
      default:
        break;
    }
  }

  /**
   * Open an existing chat session
   */
  openChat(session: ChatSession) {
    this.router.navigate([`/chat/${session._id}`], {
      state: { sessionData: session }
    });
  }

  /**
   * Toggle between active and archived chats
   */
  async toggleViewMode() {
    this.showArchived = !this.showArchived;
    if (this.showArchived && this.archivedSessions.length === 0) {
      await this.loadChatSessions();
    }
  }

  /**
   * Open action sheet menu for a chat
   */
  async openChatMenu(event: Event, session: ChatSession) {
    event.stopPropagation();

    const buttons = session.status === 'ACTIVE'
      ? [
          {
            text: 'Rename',
            icon: 'create-outline',
            handler: () => this.renameChat(session)
          },
          {
            text: 'Archive',
            icon: 'archive-outline',
            handler: () => this.archiveChat(session)
          },
          {
            text: 'Delete',
            icon: 'trash-outline',
            role: 'destructive',
            handler: () => this.deleteChat(session)
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel'
          }
        ]
      : [
          {
            text: 'Restore',
            icon: 'arrow-undo-outline',
            handler: () => this.restoreChat(session)
          },
          {
            text: 'Delete',
            icon: 'trash-outline',
            role: 'destructive',
            handler: () => this.deleteChat(session)
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel'
          }
        ];

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Chat Options',
      buttons
    });

    await actionSheet.present();
  }

  /**
   * Rename a chat session
   */
  async renameChat(session: ChatSession) {
    const alert = await this.alertCtrl.create({
      header: 'Rename Chat',
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: 'Enter new title',
          value: session.title
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.title && data.title.trim()) {
              try {
                await this.chatService.updateSession(session._id, { title: data.title.trim() });
                this.utilityService.presentToast('Chat renamed successfully', 2000);
                await this.loadChatSessions();
              } catch (error) {
                console.error('Failed to rename chat:', error);
                this.utilityService.presentToast('Failed to rename chat', 2000);
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Archive a chat session
   */
  async archiveChat(session: ChatSession) {
    try {
      await this.chatService.archiveSession(session._id);
      this.utilityService.presentToast('Chat archived', 2000);
      await this.loadChatSessions();
    } catch (error) {
      console.error('Failed to archive chat:', error);
      this.utilityService.presentToast('Failed to archive chat', 2000);
    }
  }

  /**
   * Restore an archived chat
   */
  async restoreChat(session: ChatSession) {
    // Note: API doesn't have a restore endpoint, we'd need to update session status
    // For now, show a message
    this.utilityService.presentToast('Restore feature coming soon', 2000);
  }

  /**
   * Delete a chat session permanently
   */
  async deleteChat(session: ChatSession) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Chat',
      message: 'Are you sure you want to permanently delete this chat? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await this.chatService.deleteSession(session._id);
              this.utilityService.presentToast('Chat deleted', 2000);
              await this.loadChatSessions();
            } catch (error) {
              console.error('Failed to delete chat:', error);
              this.utilityService.presentToast('Failed to delete chat', 2000);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Get context icon name
   */
  getContextIcon(contextType: ChatContextType): string {
    const icons: Record<ChatContextType, string> = {
      GENERAL: 'chatbubble-ellipses-outline',
      VISIT: 'medical-outline',
      APPOINTMENT: 'calendar-outline',
      PRESCRIPTION: 'medkit-outline',
      LAB_REPORT: 'flask-outline'
    };
    return icons[contextType] || 'chatbubble-outline';
  }

  /**
   * Get context label
   */
  getContextLabel(contextType: ChatContextType): string {
    const labels: Record<ChatContextType, string> = {
      GENERAL: 'General Health',
      VISIT: 'Visit Chat',
      APPOINTMENT: 'Appointment',
      PRESCRIPTION: 'Prescription',
      LAB_REPORT: 'Lab Report'
    };
    return labels[contextType] || contextType;
  }

  /**
   * Get CSS class for context type
   */
  getContextClass(contextType: ChatContextType): string {
    return contextType;
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(date: string | Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}

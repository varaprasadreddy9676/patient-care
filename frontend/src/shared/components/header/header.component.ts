import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatService } from '../../../services/chat/chat.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() showBackButton: boolean = true;
  @Input() showProfileChip: boolean = false;
  @Input() showNotifications: boolean = true;
  @Input() showAvatar: boolean = true;
  @Input() showAIChat: boolean = true; // Show AI chat by default
  @Input() profileName?: string;
  @Input() profileImage?: string;
  @Input() notificationCount: number = 0;
  @Input() backgroundColor: string = 'var(--mc-header-bg)';
  @Input() textColor: string = 'var(--mc-text-primary)';

  @Output() backClicked = new EventEmitter<void>();
  @Output() profileClicked = new EventEmitter<void>();
  @Output() notificationsClicked = new EventEmitter<void>();
  @Output() avatarClicked = new EventEmitter<void>();
  @Output() aiChatClicked = new EventEmitter<void>();

  constructor(private chatService: ChatService) {}

  onBackClick(): void {
    this.backClicked.emit();
  }

  onProfileClick(): void {
    this.profileClicked.emit();
  }

  onNotificationsClick(): void {
    this.notificationsClicked.emit();
  }

  onAvatarClick(): void {
    this.avatarClicked.emit();
  }

  onAIChatClick(): void {
    this.aiChatClicked.emit();
    // Navigation is handled by parent component or service
  }

  get hasNotifications(): boolean {
    return this.notificationCount > 0;
  }
}
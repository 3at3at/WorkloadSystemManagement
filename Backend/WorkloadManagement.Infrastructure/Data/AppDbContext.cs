using Microsoft.EntityFrameworkCore;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;

namespace WorkloadManagement.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();
        public DbSet<TaskAcknowledgement> TaskAcknowledgements => Set<TaskAcknowledgement>();
        public DbSet<TaskApproval> TaskApprovals => Set<TaskApproval>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.FullName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(x => x.Email)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.HasIndex(x => x.Email)
                    .IsUnique();

                entity.Property(x => x.PasswordHash)
                    .IsRequired();

                entity.Property(x => x.IsActive)
                    .HasDefaultValue(true);

                entity.Property(x => x.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(x => x.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(x => x.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.TeamLeader)
                .WithMany(x => x.TeamMembers)
                .HasForeignKey(x => x.TeamLeaderId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Name)
                    .HasConversion<int>()
                    .IsRequired();
            });

            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = RoleType.Admin },
                new Role { Id = 2, Name = RoleType.TeamLeader },
                new Role { Id = 3, Name = RoleType.Member }
            );

            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(x => x.Description)
                    .HasMaxLength(2000);

                entity.Property(x => x.Priority)
                    .HasConversion<int>()
                    .IsRequired();

                entity.Property(x => x.Complexity)
                    .HasConversion<int>()
                    .IsRequired();

                entity.Property(x => x.Status)
                    .HasConversion<int>()
                    .IsRequired();

                entity.Property(x => x.EstimatedHours)
                    .IsRequired();

                entity.Property(x => x.Weight)
                    .HasColumnType("decimal(18,2)");

                entity.Property(x => x.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(x => x.AssignedToUser)
                    .WithMany(u => u.AssignedTasks)
                    .HasForeignKey(x => x.AssignedToUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.CreatedByUser)
                    .WithMany(u => u.CreatedTasks)
                    .HasForeignKey(x => x.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<TaskAcknowledgement>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.IsAcknowledged)
                    .HasDefaultValue(false);

                entity.HasOne(x => x.TaskItem)
                    .WithMany(t => t.Acknowledgements)
                    .HasForeignKey(x => x.TaskItemId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Member)
                    .WithMany(u => u.TaskAcknowledgements)
                    .HasForeignKey(x => x.MemberId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<TaskApproval>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.ApprovalStatus)
                    .HasConversion<int>()
                    .IsRequired();

                entity.Property(x => x.RequestReason)
                    .HasMaxLength(1000);

                entity.Property(x => x.RequestedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(x => x.TaskItem)
                    .WithMany(t => t.Approvals)
                    .HasForeignKey(x => x.TaskItemId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.RequestedByUser)
                    .WithMany(u => u.RequestedApprovals)
                    .HasForeignKey(x => x.RequestedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.TargetApproverUser)
                    .WithMany(u => u.ApprovalRequestsToReview)
                    .HasForeignKey(x => x.TargetApproverUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.ApprovedByUser)
                    .WithMany(u => u.ApprovedActions)
                    .HasForeignKey(x => x.ApprovedByUserId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .IsRequired(false);
            });
        }
    }
}
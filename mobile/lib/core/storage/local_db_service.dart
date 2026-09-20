import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../constants/db_constants.dart';

/// Local Database Service (Offline SQLite Singleton)
///
/// Manages SQLite embedded storage lifecycle for underground offline operations.
/// Configures relational tables, indices, and foreign key enforcement.
class LocalDbService {
  LocalDbService._internal();
  static final LocalDbService instance = LocalDbService._internal();

  Database? _database;

  /// Returns the singleton database handle, opening on first access
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  /// Optional hook for test suites to inject mock or in-memory database
  void setDatabaseForTesting(Database db) {
    _database = db;
  }

  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, DbConstants.databaseName);

    return await openDatabase(
      path,
      version: DbConstants.databaseVersion,
      onConfigure: _onConfigure,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onConfigure(Database db) async {
    // Enforce SQLite Foreign Key constraints
    await db.execute('PRAGMA foreign_keys = ON;');
  }

  Future<void> _onCreate(Database db, int version) async {
    final batch = db.batch();

    // 1. Offline Users Table
    batch.execute(DbConstants.createOfflineUsersTableSql);

    // 2. Local Form IV Inspections Table
    batch.execute(DbConstants.createFormIvInspectionsTableSql);

    // 3. Local Media Queue Table
    batch.execute(DbConstants.createInspectionMediaTableSql);

    // 4. Sync Optimization Indices
    batch.execute(DbConstants.createFormIvSyncIndexSql);
    batch.execute(DbConstants.createMediaSyncIndexSql);

    await batch.commit(noResult: true);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Migration handling for future revisions
  }

  /// Closes database connection cleanly
  Future<void> close() async {
    if (_database != null && _database!.isOpen) {
      await _database!.close();
      _database = null;
    }
  }

  /// Completely wipes local database (used for statutory reset or dev purge)
  Future<void> deleteDatabaseFile() async {
    await close();
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, DbConstants.databaseName);
    await deleteDatabase(path);
  }
}

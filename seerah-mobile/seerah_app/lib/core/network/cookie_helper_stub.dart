import 'package:dio/dio.dart';

// Web stub: browser handles cookies natively, no Dio interceptor needed.
Future<void> attachCookies(Dio dio) async {}
Future<void> clearAllCookies() async {}
Map<String, String> getCurrentCookies() => {};
